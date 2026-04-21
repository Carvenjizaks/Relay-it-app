import { redirect } from "next/navigation"

// Events have been merged into Campaigns - redirect to create campaign
export default function NewEventPage() {
  redirect("/dashboard/campaigns/new")
}
