import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/events/[eventId]/leaderboard
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get credits for this event
    const { data: credits } = await supabaseAdmin
      .from('credits')
      .select(`
        user_id,
        amount,
        user:users(id, name, email, company)
      `)
      .eq('event_id', eventId)

    // Aggregate by user
    const leaderboard = credits?.reduce((acc: any, credit) => {
      const userId = credit.user_id
      if (!acc[userId]) {
        const userData = Array.isArray(credit.user) ? credit.user[0] : credit.user
        acc[userId] = {
          user_id: userId,
          name: userData?.name,
          email: userData?.email,
          company: userData?.company,
          total_credits: 0
        }
      }
      acc[userId].total_credits += credit.amount
      return acc
    }, {})

    // Convert to array, filter positive credits, sort, and limit
    const sortedLeaderboard = Object.values(leaderboard || {})
      .filter((u: any) => u.total_credits > 0)
      .sort((a: any, b: any) => b.total_credits - a.total_credits)
      .slice(0, limit)
      .map((u: any, index: number) => ({ ...u, rank: index + 1 }))

    return NextResponse.json({ 
      success: true, 
      data: sortedLeaderboard,
      total_referrers: sortedLeaderboard.length
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
