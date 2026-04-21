"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function NewEventPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [maxAttendees, setMaxAttendees] = useState("")
  const [creditsPerReferral, setCreditsPerReferral] = useState("10")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      title,
      description: description || null,
      location: location || null,
      event_date: new Date(eventDate).toISOString(),
      max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      credits_per_referral: parseInt(creditsPerReferral),
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard/events")
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Events
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-4">Create New Event</h1>
        <p className="text-muted-foreground mt-1">Set up your event to start collecting referrals</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8">
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Event Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Tech Conference 2024"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              placeholder="Tell people about your event..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-foreground mb-2">
                Event Date *
              </label>
              <input
                id="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxAttendees" className="block text-sm font-medium text-foreground mb-2">
                Max Attendees
              </label>
              <input
                id="maxAttendees"
                type="number"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(e.target.value)}
                min="1"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="100"
              />
              <p className="mt-1 text-xs text-muted-foreground">Leave empty for unlimited</p>
            </div>

            <div>
              <label htmlFor="creditsPerReferral" className="block text-sm font-medium text-foreground mb-2">
                Credits per Referral *
              </label>
              <input
                id="creditsPerReferral"
                type="number"
                value={creditsPerReferral}
                onChange={(e) => setCreditsPerReferral(e.target.value)}
                required
                min="1"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className="mt-1 text-xs text-muted-foreground">Credits awarded when referral registers</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating..." : "Create Event"}
          </button>
          <Link
            href="/dashboard/events"
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
