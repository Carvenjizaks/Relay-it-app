import { redirect } from "next/navigation"

// Legacy events page - redirect to home
// Campaign sharing now uses /relay/[token] route
export default async function PublicEventPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  redirect("/")
}
