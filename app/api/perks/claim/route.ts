import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, perkClaimedEmail } from '@/lib/email'

// POST /api/perks/claim - Claim a perk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { perk_id, user_id, event_id } = body

    if (!perk_id || !user_id || !event_id) {
      return NextResponse.json(
        { success: false, error: 'Perk ID, user ID, and event ID are required' },
        { status: 400 }
      )
    }

    // Get perk details
    const { data: perk, error: perkError } = await supabaseAdmin
      ?.from('perks')
      .select('*')
      .eq('id', perk_id)
      .single()

    if (perkError || !perk) {
      return NextResponse.json(
        { success: false, error: 'Perk not found' },
        { status: 404 }
      )
    }

    // Check if perk is sold out
    if (perk.quantity_available && perk.quantity_claimed >= perk.quantity_available) {
      return NextResponse.json(
        { success: false, error: 'Perk is sold out' },
        { status: 409 }
      )
    }

    // Check if user already claimed this perk
    const { data: existingClaim } = await supabaseAdmin
      ?.from('perk_claims')
      .select('id')
      .eq('perk_id', perk_id)
      .eq('user_id', user_id)
      .single()

    if (existingClaim) {
      return NextResponse.json(
        { success: false, error: 'You have already claimed this perk' },
        { status: 409 }
      )
    }

    // Check user's available credits
    const { data: credits } = await supabaseAdmin
      ?.from('credits')
      .select('amount')
      .eq('user_id', user_id)
      .eq('event_id', event_id)

    const availableCredits = credits?.reduce((sum, c) => sum + c.amount, 0) || 0

    if (availableCredits < perk.credit_cost) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. Available: ${availableCredits}, Required: ${perk.credit_cost}` },
        { status: 402 }
      )
    }

    // Create claim
    const { data, error } = await supabaseAdmin
      ?.from('perk_claims')
      .insert([{
        perk_id,
        user_id,
        event_id,
        credits_spent: perk.credit_cost
      }])
      .select()
      .single()

    if (error) throw error

    // Deduct credits
    await supabaseAdmin
      ?.from('credits')
      .insert([{
        user_id,
        event_id,
        amount: -perk.credit_cost,
        reason: 'manual_adjustment',
        note: `Perk claim: ${perk.name}`
      }])

    // Update perk claimed count
    await supabaseAdmin
      ?.from('perks')
      .update({ quantity_claimed: perk.quantity_claimed + 1 })
      .eq('id', perk_id)

    // Send confirmation email
    const { data: userData } = await supabaseAdmin
      ?.from('users')
      .select('email, name')
      .eq('id', user_id)
      .single()

    const { data: eventData } = await supabaseAdmin
      ?.from('events')
      .select('name')
      .eq('id', event_id)
      .single()

    if (userData && eventData) {
      const { html, text } = perkClaimedEmail(
        userData.name,
        perk.name,
        eventData.name,
        perk.credit_cost
      )
      sendEmail({
        to: userData.email,
        subject: `Perk claimed: ${perk.name}`,
        html,
        text
      }).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Successfully claimed: ${perk.name}`
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error claiming perk:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to claim perk' },
      { status: 500 }
    )
  }
}
