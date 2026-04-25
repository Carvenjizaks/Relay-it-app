import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { UnsubscribeClient } from "./unsubscribe-client"

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Find the contact by their ID (used as token for unsubscribe links)
  const { data: contactData } = await supabase
    .from("contacts")
    .select("id, name, email, unsubscribed, campaign:campaigns!contacts_campaign_id_fkey(title)")
    .eq("id", token)
    .single()

  if (!contactData) {
    notFound()
  }

  // Transform campaign array to single object
  const contact = {
    ...contactData,
    campaign: Array.isArray(contactData.campaign) && contactData.campaign.length > 0 
      ? contactData.campaign[0] 
      : null
  }

  return <UnsubscribeClient contact={contact} token={token} />
}
