import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/events/[eventId]/analytics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get registration stats
    const { data: registrations } = await supabaseAdmin
      .from('registrations')
      .select('status')
      .eq('event_id', eventId)

    // Get referral stats
    const { data: referralLinks } = await supabaseAdmin
      .from('referral_links')
      .select('click_count, registration_count')
      .eq('event_id', eventId)

    // Calculate stats
    const totalRegistrations = registrations?.length || 0
    const confirmedRegistrations = registrations?.filter(r => r.status === 'confirmed').length || 0
    const attendedRegistrations = registrations?.filter(r => r.status === 'attended').length || 0
    const totalClicks = referralLinks?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0
    const totalReferralRegistrations = referralLinks?.reduce((sum, l) => sum + (l.registration_count || 0), 0) || 0

    const stats = {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        event_date: event.event_date,
      },
      registrations: {
        total: totalRegistrations,
        confirmed: confirmedRegistrations,
        attended: attendedRegistrations,
        conversion_rate: totalRegistrations > 0 
          ? Math.round((attendedRegistrations / totalRegistrations) * 100) 
          : 0
      },
      referrals: {
        total_links: referralLinks?.length || 0,
        total_clicks: totalClicks,
        total_registrations: totalReferralRegistrations,
        conversion_rate: totalClicks > 0 
          ? Math.round((totalReferralRegistrations / totalClicks) * 100) 
          : 0
      }
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
