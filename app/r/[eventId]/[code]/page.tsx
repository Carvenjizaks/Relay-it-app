import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

// This page handles referral link redirects
// URL format: /r/{eventId}/{code}
export default async function ReferralRedirect({
  params,
}: {
  params: Promise<{ eventId: string; code: string }>
}) {
  const { eventId, code } = await params

  if (!supabaseAdmin) {
    redirect('/?error=database_not_configured')
  }

  // Validate the referral link
  const { data: link } = await supabaseAdmin
    .from('referral_links')
    .select('id, event_id, is_active, expires_at, max_uses, click_count')
    .eq('code', code.toUpperCase())
    .eq('event_id', eventId)
    .single()

  // Check if link is valid
  if (!link) {
    redirect('/?error=invalid_code')
  }

  if (!link.is_active) {
    redirect('/?error=inactive_link')
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    redirect('/?error=expired_link')
  }

  if (link.max_uses && link.click_count >= link.max_uses) {
    redirect('/?error=max_uses_reached')
  }

  // Record the click (in background)
  supabaseAdmin.from('link_clicks').insert([{
    referral_link_id: link.id,
    device_type: 'unknown'
  }]).then(() => {
    // Update click count
    supabaseAdmin?.from('referral_links')
      .update({ click_count: link.click_count + 1 })
      .eq('id', link.id)
  }, console.error)

  // Redirect to registration page with referral code
  redirect(`/register?event=${eventId}&ref=${code}`)
}
