import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  // Get stats
  const [
    { count: totalUsers },
    { count: totalCampaigns },
    { count: totalContacts },
    { count: emailsSent },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "sent"),
  ])

  // Get recent campaigns
  const { data: recentCampaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      created_by_profile:profiles!campaigns_created_by_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get recent contacts
  const { data: recentContacts } = await supabase
    .from("contacts")
    .select(`
      *,
      campaign:campaigns(name)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Admin Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Users</p>
          <p className="text-3xl font-bold text-foreground">{totalUsers || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Campaigns</p>
          <p className="text-3xl font-bold text-foreground">{totalCampaigns || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Contacts</p>
          <p className="text-3xl font-bold text-foreground">{totalContacts || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Emails Sent</p>
          <p className="text-3xl font-bold text-foreground">{emailsSent || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Campaigns */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentCampaigns?.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="p-4 hover:bg-muted/30 block transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-foreground">{campaign.title}</p>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    campaign.status === "active" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Created by {campaign.created_by_profile?.full_name || "Unknown"}
                </p>
              </Link>
            ))}
            {(!recentCampaigns || recentCampaigns.length === 0) && (
              <p className="p-4 text-muted-foreground text-sm">No campaigns yet</p>
            )}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Contacts</h2>
            <Link href="/dashboard/admin/contacts" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentContacts?.map((contact) => (
              <div key={contact.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    contact.relay_depth === 0 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {contact.relay_depth === 0 ? "Initial" : `Level ${contact.relay_depth}`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{contact.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Campaign: {contact.campaign?.name || "Unknown"}
                </p>
              </div>
            ))}
            {(!recentContacts || recentContacts.length === 0) && (
              <p className="p-4 text-muted-foreground text-sm">No contacts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
