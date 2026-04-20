import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/events/[eventId]/tree/[userId]
// Get the referral tree/network for a specific user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string; userId: string }> }
) {
  try {
    const { eventId, userId } = await params

    // Get the user's position in the chain
    const { data: chain } = await supabaseAdmin
      ?.from('referral_chain')
      .select(`
        *,
        user:users(id, name, email),
        referrer:users!referral_chain_referrer_id_fkey(id, name, email)
      `)
      .eq('event_id', eventId)
      .eq('root_referrer_id', userId)
      .order('depth', { ascending: true })

    // Get the root user
    const { data: rootUser } = await supabaseAdmin
      ?.from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    // Build tree structure
    const tree = {
      root: rootUser,
      total_referrals: chain?.length || 0,
      by_depth: chain?.reduce((acc: any, item) => {
        const depth = item.depth
        if (!acc[depth]) acc[depth] = []
        acc[depth].push({
          user: item.user,
          referrer: item.referrer,
          depth: item.depth
        })
        return acc
      }, {})
    }

    return NextResponse.json({ success: true, data: tree })
  } catch (error) {
    console.error('Error fetching referral tree:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referral tree' },
      { status: 500 }
    )
  }
}
