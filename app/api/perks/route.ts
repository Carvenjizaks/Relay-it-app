import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { nanoid } from 'nanoid'

// GET /api/perks - List perks for event
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }


    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      ?.from('perks')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('credit_cost', { ascending: true })

    if (error) throw error

    // Calculate availability
    const perksWithAvailability = data?.map(perk => ({
      ...perk,
      is_available: !perk.quantity_available || perk.quantity_claimed < perk.quantity_available
    }))

    return NextResponse.json({ success: true, data: perksWithAvailability })
  } catch (error) {
    console.error('Error fetching perks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch perks' },
      { status: 500 }
    )
  }
}

// POST /api/perks - Create new perk
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }


    const body = await request.json()
    const {
      event_id,
      name,
      description,
      credit_cost,
      quantity_available,
      perk_type
    } = body

    if (!event_id || !name || !credit_cost || !perk_type) {
      return NextResponse.json(
        { success: false, error: 'Event ID, name, credit cost, and perk type are required' },
        { status: 400 }
      )
    }

    const validTypes = ['access', 'upgrade', 'recognition', 'swag', 'experience', 'priority']
    if (!validTypes.includes(perk_type)) {
      return NextResponse.json(
        { success: false, error: `Perk type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      ?.from('perks')
      .insert([{
        event_id,
        name,
        description,
        credit_cost,
        quantity_available,
        perk_type
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating perk:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create perk' },
      { status: 500 }
    )
  }
}
