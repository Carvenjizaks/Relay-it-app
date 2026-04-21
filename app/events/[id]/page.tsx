import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { EventRegistrationForm } from "@/components/event-registration-form"

export default async function PublicEventPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { id } = await params
  const { ref } = await searchParams
  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (!event) {
    notFound()
  }

  // Get referral if ref code provided
  let referralId: string | null = null
  if (ref) {
    const { data: referral } = await supabase
      .from("referrals")
      .select("id")
      .eq("event_id", id)
      .eq("referred_email", ref)
      .single()
    
    if (referral) {
      referralId = referral.id
    }
  }

  const { count } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id)

  const spotsRemaining = event.max_attendees ? event.max_attendees - (count ?? 0) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Event Header */}
        <div className="text-center mb-8">
          <p className="text-sm text-primary font-medium mb-2">You&apos;re invited to</p>
          <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
          {event.description && (
            <p className="text-muted-foreground mt-4">{event.description}</p>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium text-foreground">
                  {new Date(event.event_date).toLocaleString()}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{event.location}</p>
                </div>
              </div>
            )}

            {spotsRemaining !== null && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spots Remaining</p>
                  <p className="font-medium text-foreground">{spotsRemaining}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Register for this event</h2>
          {spotsRemaining === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">This event is full. No more spots available.</p>
            </div>
          ) : (
            <EventRegistrationForm eventId={id} referralId={referralId} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Powered by <span className="font-medium text-primary">Relay-it</span>
        </p>
      </div>
    </div>
  )
}
