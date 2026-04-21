import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: events }, { data: referrals }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("events").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("referrals").select("*").eq("referrer_id", user!.id).order("created_at", { ascending: false }).limit(5),
  ])

  const stats = [
    { label: "Total Events", value: events?.length ?? 0 },
    { label: "Total Referrals", value: profile?.total_referrals ?? 0 },
    { label: "Credits Earned", value: profile?.total_credits ?? 0 },
    { label: "Pending Referrals", value: referrals?.filter(r => r.status === "pending").length ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name || "there"}!</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Create Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Referral Code */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Your Referral Code</h2>
        <p className="text-muted-foreground text-sm mb-4">Share this code with others to earn credits when they register for events.</p>
        <div className="flex items-center gap-4">
          <code className="px-4 py-3 bg-accent rounded-lg font-mono text-lg text-foreground">
            {profile?.referral_code}
          </code>
          <CopyButton text={profile?.referral_code || ""} />
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
          <Link href="/dashboard/events" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  event.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {event.is_active ? "Active" : "Inactive"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No events yet. Create your first event!</p>
        )}
      </div>
    </div>
  )
}
