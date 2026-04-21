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
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, name, email, unsubscribed, campaign:campaigns!contacts_campaign_id_fkey(title)")
    .eq("id", token)
    .single()

  if (!contact) {
    notFound()
  }

  return <UnsubscribeClient contact={contact} token={token} />
}
