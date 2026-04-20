import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

// GET /api/link-clicks - Get click analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const referralLinkId = searchParams.get('referral_link_id')
    const eventId = searchParams.get('event_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabaseAdmin
      ?.from('link_clicks')
      .select(`
        *,
        referral_link:referral_links(id, code, referrer_id)
      `)

    if (referralLinkId) {
      query = query?.eq('referral_link_id', referralLinkId)
    }

    if (startDate) {
      query = query?.gte('clicked_at', startDate)
    }

    if (endDate) {
      query = query?.lte('clicked_at', endDate)
    }

    const { data, error } = await query!.order('clicked_at', { ascending: false })

    if (error) throw error

    // Aggregate stats
    const stats = {
      total_clicks: data?.length || 0,
      unique_countries: new Set(data?.map(c => c.country).filter(Boolean)).size,
      device_breakdown: data?.reduce((acc: any, click) => {
        const device = click.device_type || 'unknown'
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({ success: true, data, stats })
  } catch (error) {
    console.error('Error fetching link clicks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch link clicks' },
      { status: 500 }
    )
  }
}

// POST /api/link-clicks - Record a click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, user_agent, referer_url } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Find the referral link
    const { data: link, error: linkError } = await supabaseAdmin
      ?.from('referral_links')
      .select('id, event_id, click_count, max_uses, expires_at, is_active')
      .eq('code', code.toUpperCase())
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Check if link is active
    if (!link.is_active) {
      return NextResponse.json(
        { success: false, error: 'Referral link is inactive' },
        { status: 403 }
      )
    }

    // Check if expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Referral link has expired' },
        { status: 403 }
      )
    }

    // Check max uses
    if (link.max_uses && link.click_count >= link.max_uses) {
      return NextResponse.json(
        { success: false, error: 'Referral link has reached maximum uses' },
        { status: 403 }
      )
    }

    // Parse user agent for device type
    const deviceType = parseDeviceType(user_agent)

    // Hash IP for privacy
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const ipHash = ip !== 'unknown'
      ? createHash('sha256').update(ip).digest('hex').substring(0, 16)
      : null

    // Record the click
    const { data, error } = await supabaseAdmin
      ?.from('link_clicks')
      .insert([{
        referral_link_id: link.id,
        ip_hash: ipHash,
        user_agent,
        referer_url,
        device_type: deviceType
      }])
      .select()
      .single()

    if (error) throw error

    // Update click count on referral link
    await supabaseAdmin
      ?.from('referral_links')
      .update({ click_count: link.click_count + 1 })
      .eq('id', link.id)

    return NextResponse.json({
      success: true,
      data,
      event_id: link.event_id
    })
  } catch (error) {
    console.error('Error recording link click:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record click' },
      { status: 500 }
    )
  }
}

function parseDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown'

  const ua = userAgent.toLowerCase()

  if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
    if (/ipad/.test(ua)) return 'tablet'
    if (/mobile|iphone|ipod|android.*mobile/.test(ua)) return 'mobile'
    return 'tablet'
  }

  if (/tablet|ipad/.test(ua)) return 'tablet'

  return 'desktop'
}
