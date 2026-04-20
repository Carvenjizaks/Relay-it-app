import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { sendEmail, registrationConfirmationEmail, referralNotificationEmail } from '@/lib/email'

const TENANT_SLUG = process.env.TENANT_SLUG || 'nexium-digital'

async function getTenantId() {
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single()
  return data?.id
}

// POST /api/register - Register for an event (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      event_id,
      email,
      name,
      phone,
      company,
      job_title,
      referral_code,
      custom_fields
    } = body

    if (!event_id || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'Event ID, email, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user exists, create if not
    let { data: user } = await supabaseAdmin
      ?.from('users')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single()

    if (!user) {
      const { data: newUser, error: userError } = await supabaseAdmin
        ?.from('users')
        .insert([{
          tenant_id: tenantId,
          email,
          name,
          phone,
          company,
          job_title,
          source: referral_code ? 'referral' : 'organic'
        }])
        .select('id, name')
        .single()

      if (userError) {
        console.error('Error creating user:', userError)
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        )
      }
      user = newUser
    }

    // Find referral link if code provided
    let referralLinkId = null
    let referredBy = null
    let referrer = null

    if (referral_code) {
      const { data: link } = await supabaseAdmin
        ?.from('referral_links')
        .select('id, referrer_id, event_id, click_count, max_uses, expires_at, is_active')
        .eq('code', referral_code.toUpperCase())
        .eq('event_id', event_id)
        .single()

      if (link) {
        // Validate link
        if (!link.is_active) {
          return NextResponse.json(
            { success: false, error: 'Referral link is inactive' },
            { status: 403 }
          )
        }

        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          return NextResponse.json(
            { success: false, error: 'Referral link has expired' },
            { status: 403 }
          )
        }

        if (link.max_uses && link.click_count >= link.max_uses) {
          return NextResponse.json(
            { success: false, error: 'Referral link has reached maximum uses' },
            { status: 403 }
          )
        }

        referralLinkId = link.id
        referredBy = link.referrer_id

        // Get referrer details for email
        const { data: refUser } = await supabaseAdmin
          ?.from('users')
          .select('email, name')
          .eq('id', link.referrer_id)
          .single()
        referrer = refUser
      }
    }

    // Create registration
    const { data: registration, error: regError } = await supabaseAdmin
      ?.from('registrations')
      .insert([{
        event_id,
        user_id: user.id,
        referral_link_id: referralLinkId,
        referred_by: referredBy,
        custom_fields: custom_fields || {},
        status: 'registered'
      }])
      .select()
      .single()

    if (regError) {
      if (regError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Already registered for this event' },
          { status: 409 }
        )
      }
      throw regError
    }

    // Get event details for email
    const { data: event } = await supabaseAdmin
      ?.from('events')
      .select('*')
      .eq('id', event_id)
      .single()

    // Send emails (non-blocking)
    if (event) {
      const { html, text } = registrationConfirmationEmail(
        name,
        event.name,
        event.event_date,
        event.location,
        referral_code
      )
      sendEmail({
        to: email,
        subject: `You're registered for ${event.name}!`,
        html,
        text
      }).catch(console.error)

      // Send referral notification to referrer
      if (referrer && event.credits_per_direct_referral > 0) {
        const { html: refHtml, text: refText } = referralNotificationEmail(
          referrer.name,
          name,
          event.name,
          event.credits_per_direct_referral
        )
        sendEmail({
          to: referrer.email,
          subject: `New referral! You earned ${event.credits_per_direct_referral} credits`,
          html: refHtml,
          text: refText
        }).catch(console.error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { registration, user, event: { name: event?.name } }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create registration' },
      { status: 500 }
    )
  }
}
