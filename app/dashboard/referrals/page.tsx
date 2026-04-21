import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("created_by", user!.id)

  // Get contacts with relay chains for user's campaigns
  const { data: contacts } = await supabase
    .from("contacts")
    .select(`
      *,
      campaign:campaigns (
        id,
        title
      )
    `)
    .in("campaign_id", campaigns?.map(c => c.id) || [])
    .order("created_at", { ascending: false })

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single()

  // Calculate stats based on relay depth (contacts referred by others)
  const referredContacts = contacts?.filter(c => c.referred_by_contact_id !== null) || []
  const stats = {
    totalContacts: contacts?.length ?? 0,
    totalRelayed: referredContacts.length,
    avgRelayDepth: contacts?.length 
      ? (contacts.reduce((sum, c) => sum + (c.relay_depth || 0), 0) / contacts.length).toFixed(1)
      : "0",
    emailsSent: contacts?.filter(c => c.email_sent).length ?? 0,
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relay Performance</h1>
        <p className="text-muted-foreground mt-1">Track your viral relay chains and referral performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Total Contacts</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.totalContacts}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Relayed Contacts</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.totalRelayed}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Avg Relay Depth</p>
          <p className="text-3xl font-bold text-info mt-1">{stats.avgRelayDepth}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Emails Sent</p>
          <p className="text-3xl font-bold text-success mt-1">{stats.emailsSent}</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Your Profile Code</h2>
        <p className="text-muted-foreground text-sm mb-4">
          This is your unique profile identifier used for tracking attribution.
        </p>
        <code className="px-4 py-3 bg-muted rounded-lg font-mono text-lg text-foreground inline-block">
          {profile?.referral_code || "N/A"}
        </code>
      </div>

      {/* Relay Chain Contacts */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Relay Chain Activity</h2>
          <p className="text-sm text-muted-foreground mt-1">Contacts acquired through viral relay sharing</p>
        </div>
        
        {contacts && contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Relay Depth</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-foreground">
                        {contact.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/dashboard/campaigns/${contact.campaign?.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {contact.campaign?.title || "Unknown"}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        contact.relay_depth === 0 
                          ? "bg-muted text-muted-foreground" 
                          : contact.relay_depth === 1
                          ? "bg-primary/10 text-primary"
                          : contact.relay_depth === 2
                          ? "bg-info/10 text-info"
                          : "bg-success/10 text-success"
                      }`}>
                        {contact.relay_depth === 0 ? "Direct" : `Level ${contact.relay_depth}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {contact.email_sent ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-success/10 text-success">
                            Email Sent
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-warning/10 text-warning">
                            Pending
                          </span>
                        )}
                        {contact.has_relayed && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            Relayed ({contact.relay_count})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-4">No relay activity yet</p>
            <Link
              href="/dashboard/campaigns/new"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Create a campaign to start collecting contacts
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
