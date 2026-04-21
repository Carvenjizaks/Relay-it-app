import { redirect } from "next/navigation"

// Events have been merged into Campaigns - redirect to campaigns
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/campaigns/${id}`)
}
