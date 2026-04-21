import { redirect } from "next/navigation"

// Events have been merged into Campaigns - redirect to campaigns page
export default function EventsPage() {
  redirect("/dashboard/campaigns")
}
