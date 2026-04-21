import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ReferralForm } from "@/components/referral-form"
import { RegistrationsList } from "@/components/registrations-list"

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single()

  if (!event) {
    notFound()
  }

  const [{ data: referrals }, { data: registrations }] = await Promise.all([
    supabase.from("referrals").select("*").eq("event_id", id).order("created_at", { ascending: false }),
    supabase.from("registrations").select("*").eq("event_id", id).order("created_at", { ascending: false }),
  ])

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/events/${id}`

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Events
        </Link>
      </div>

      {/* Event Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
            {event.description && (
              <p className="text-muted-foreground mt-2">{event.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(event.event_date).toLocaleString()}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </span>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            event.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}>
            {event.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Share Link */}
        <div className="mt-6 p-4 bg-accent/50 rounded-lg">
          <p className="text-sm font-medium text-foreground mb-2">Share this event</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Registrations</p>
          <p className="text-3xl font-bold text-foreground mt-1">{registrations?.length ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Referrals Sent</p>
          <p className="text-3xl font-bold text-foreground mt-1">{referrals?.length ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Converted</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            {referrals?.filter(r => r.status !== "pending").length ?? 0}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Credits/Referral</p>
          <p className="text-3xl font-bold text-foreground mt-1">{event.credits_per_referral}</p>
        </div>
      </div>

      {/* Add Referral */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Send a Referral</h2>
        <ReferralForm eventId={id} />
      </div>

      {/* Referrals List */}
      {referrals && referrals.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Referrals</h2>
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{referral.referred_name || referral.referred_email}</p>
                  <p className="text-sm text-muted-foreground">{referral.referred_email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  referral.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  referral.status === "registered" ? "bg-blue-100 text-blue-700" :
                  referral.status === "attended" ? "bg-green-100 text-green-700" :
                  "bg-purple-100 text-purple-700"
                }`}>
                  {referral.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registrations */}
      <RegistrationsList registrations={registrations || []} />
    </div>
  )
}
