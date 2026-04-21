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

  // Find the contact by their relay token or create a simple token system
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, name, email, unsubscribed, campaign:campaigns(title)")
    .eq("id", token)
    .single()

  if (!contact) {
    notFound()
  }

  return <UnsubscribeClient contact={contact} token={token} />
}
