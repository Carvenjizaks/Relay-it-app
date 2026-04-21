import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get profile first to determine query filter
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"
  const isManager = profile?.role === "manager"
  const canCreate = isAdmin || isManager

  // Build optimized campaign query
  let query = supabase
    .from("campaigns")
    .select(`id, title, status, created_at, contacts:contacts!contacts_campaign_id_fkey(count)`)
    .order("created_at", { ascending: false })
    .limit(50)
  
  if (!isAdmin) {
    query = query.eq("created_by", user.id)
  }
  
  const { data: campaigns } = await query

  const tabs = [
    { key: "all", label: "All", count: campaigns?.length || 0 },
    { key: "active", label: "Active", count: campaigns?.filter(c => c.status === "active").length || 0 },
    { key: "draft", label: "Draft", count: campaigns?.filter(c => c.status === "draft").length || 0 },
    { key: "completed", label: "Completed", count: campaigns?.filter(c => c.status === "completed").length || 0 },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your email campaigns and track relay performance
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                i === 0 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                  i === 0 ? "bg-primary/10 text-primary" : "bg-muted-foreground/10"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors z-10 relative"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </Link>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {!campaigns || campaigns.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-2">No campaigns match your selected filters.</p>
            <Link
              href="/dashboard/campaigns/new"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Create a new campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    campaign.status === "active" 
                      ? "bg-success/10" 
                      : campaign.status === "draft"
                      ? "bg-warning/10"
                      : "bg-muted"
                  }`}>
                    <svg className={`w-5 h-5 ${
                      campaign.status === "active" 
                        ? "text-success" 
                        : campaign.status === "draft"
                        ? "text-warning"
                        : "text-muted-foreground"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {campaign.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{campaign.contacts?.[0]?.count || 0} contacts</span>
                      <span className="text-border">·</span>
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    campaign.status === "active" 
                      ? "bg-success/10 text-success" 
                      : campaign.status === "draft"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {campaign.status || "draft"}
                  </span>
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* View All Button */}
      {campaigns && campaigns.length > 0 && (
        <div className="mt-6 text-center">
          <button className="px-6 py-2.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium text-foreground transition-colors">
            View all
          </button>
        </div>
      )}
    </div>
  )
}
