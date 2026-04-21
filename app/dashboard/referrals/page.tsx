import { createClient } from "@/lib/supabase/server"

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: referrals } = await supabase
    .from("referrals")
    .select(`
      *,
      events (
        id,
        title,
        credits_per_referral
      )
    `)
    .eq("referrer_id", user!.id)
    .order("created_at", { ascending: false })

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single()

  const stats = {
    total: referrals?.length ?? 0,
    pending: referrals?.filter(r => r.status === "pending").length ?? 0,
    registered: referrals?.filter(r => r.status === "registered").length ?? 0,
    credited: referrals?.filter(r => r.status === "credited").length ?? 0,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
        <p className="text-muted-foreground mt-1">Track your referrals and earned credits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Total Referrals</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Registered</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.registered}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Credits Earned</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{profile?.total_credits ?? 0}</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Your Referral Code</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Share this code when referring people to events. You&apos;ll earn credits when they register!
        </p>
        <code className="px-4 py-3 bg-accent rounded-lg font-mono text-lg text-foreground inline-block">
          {profile?.referral_code}
        </code>
      </div>

      {/* Referrals List */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">All Referrals</h2>
        {referrals && referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Person</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Event</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Credits</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-foreground">
                        {referral.referred_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">{referral.referred_email}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {referral.events?.title || "Unknown Event"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        referral.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        referral.status === "registered" ? "bg-blue-100 text-blue-700" :
                        referral.status === "attended" ? "bg-green-100 text-green-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {referral.credits_awarded > 0 ? (
                        <span className="text-green-600">+{referral.credits_awarded}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No referrals yet. Start referring people to events!</p>
        )}
      </div>
    </div>
  )
}
