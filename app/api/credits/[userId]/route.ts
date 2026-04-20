import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/credits/[userId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    let query = supabaseAdmin
      ?.from('credits')
      .select(`
        *,
        event:events(id, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (eventId) {
      query = query?.eq('event_id', eventId)
    }

    const { data, error } = await query!

    if (error) throw error

    // Calculate totals
    const totalCredits = data?.reduce((sum, c) => sum + c.amount, 0) || 0
    const earned = data?.filter(c => c.amount > 0).reduce((sum, c) => sum + c.amount, 0) || 0
    const spent = data?.filter(c => c.amount < 0).reduce((sum, c) => sum + Math.abs(c.amount), 0) || 0

    return NextResponse.json({
      success: true,
      data,
      summary: {
        total_credits: totalCredits,
        total_earned: earned,
        total_spent: spent
      }
    })
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}
