import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const TENANT_SLUG = process.env.TENANT_SLUG || 'nexium-digital'

async function getTenantId() {
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single()
  return data?.id
}

// GET /api/events - List events for tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin
      ?.from('events')
      .select(`
        *,
        registrations:registrations(count),
        confirmed:registrations(count).eq(status, 'confirmed'),
        attended:registrations(count).eq(status, 'attended')
      `)
      .eq('tenant_id', tenantId)
      .order('event_date', { ascending: true })

    if (status) {
      query = query?.eq('status', status)
    }

    const { data, error } = await query!

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create new event
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
      name,
      description,
      event_date,
      location,
      capacity,
      registration_deadline,
      referral_enabled,
      max_referral_depth,
      credits_per_direct_referral,
      credits_per_indirect_referral,
      credits_per_attendance,
      created_by
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Event name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      ?.from('events')
      .insert([{
        tenant_id: tenantId,
        name,
        description,
        event_date,
        location,
        capacity,
        registration_deadline,
        referral_enabled,
        max_referral_depth,
        credits_per_direct_referral,
        credits_per_indirect_referral,
        credits_per_attendance,
        created_by,
        status: 'draft'
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
