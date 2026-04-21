"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function ReferralForm({ eventId }: { eventId: string }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("referrals").insert({
      event_id: eventId,
      referrer_id: user.id,
      referred_email: email,
      referred_name: name || null,
    })

    if (error) {
      if (error.code === "23505") {
        setError("This email has already been referred to this event")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setEmail("")
    setName("")
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Referral sent successfully!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="referralEmail" className="block text-sm font-medium text-foreground mb-2">
            Email *
          </label>
          <input
            id="referralEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="friend@example.com"
          />
        </div>
        <div>
          <label htmlFor="referralName" className="block text-sm font-medium text-foreground mb-2">
            Name
          </label>
          <input
            id="referralName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="John Doe"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Sending..." : "Send Referral"}
      </button>
    </form>
  )
}
