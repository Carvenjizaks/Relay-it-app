import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Optimized: fetch profile and campaigns in parallel with minimal fields
  const [{ data: profile }, { data: campaigns }] = await Promise.all([
    supabase.from("profiles").select("full_name, referral_code, role").eq("id", user!.id).single(),
    supabase.from("campaigns").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
  ])

  const isAdmin = profile?.role === "admin"

  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">
          Welcome back, {profile?.full_name || user?.email?.split("@")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your campaigns and track relay performance
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link 
          href="/dashboard/campaigns/new"
          className="group p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">New Campaign</h3>
          <p className="text-sm text-muted-foreground">Create and launch a new email campaign</p>
        </Link>

        <Link 
          href="/dashboard/campaigns"
          className="group p-6 bg-card border border-border rounded-xl hover:border-info/50 hover:shadow-lg hover:shadow-info/5 transition-all"
        >
          <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-info/20 transition-colors">
            <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">View Campaigns</h3>
          <p className="text-sm text-muted-foreground">Manage existing campaigns and contacts</p>
        </Link>

        <Link 
          href="/dashboard/referrals"
          className="group p-6 bg-card border border-border rounded-xl hover:border-success/50 hover:shadow-lg hover:shadow-success/5 transition-all"
        >
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">Referrals</h3>
          <p className="text-sm text-muted-foreground">Track referral chain and performance</p>
        </Link>
      </div>

      {/* Campaigns Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your Campaigns</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Recently created campaigns</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                Active
              </div>
              <Link 
                href="/dashboard/campaigns"
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium text-foreground transition-colors"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    campaign.status === "active" ? "bg-success/10" : "bg-muted"
                  }`}>
                    <svg className={`w-5 h-5 ${
                      campaign.status === "active" ? "text-success" : "text-muted-foreground"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{campaign.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    campaign.status === "active" 
                      ? "bg-success/10 text-success" 
                      : campaign.status === "draft"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {campaign.status || "draft"}
                  </span>
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Link
              href="/dashboard/campaigns/new"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Create your first campaign
            </Link>
          </div>
        )}
      </div>

      {/* Admin Referral Code Card - Only visible to admins */}
      {isAdmin && (
        <div className="mt-6 p-6 bg-gradient-to-r from-primary/5 via-info/5 to-success/5 border border-border rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Admin Referral Code</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">Admin Only</span>
              </div>
              <p className="text-sm text-muted-foreground">Share to earn credits when contacts convert</p>
            </div>
            <div className="flex items-center gap-3">
              <code className="px-4 py-2 bg-card border border-border rounded-lg font-mono text-foreground">
                {profile?.referral_code}
              </code>
              <CopyButton text={profile?.referral_code || ""} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
