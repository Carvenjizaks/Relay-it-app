"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"

interface Campaign {
  id: string
  title: string
  description: string
  event_url: string
  event_date: string | null
  event_location: string | null
  email_subject: string
  email_body: string
  call_to_action: string
  status: string
  created_at: string
}

interface Contact {
  id: string
  name: string
  email: string
  relay_depth: number
  referred_by_contact_id: string | null
  email_sent: boolean
  has_relayed: boolean
  relay_count: number
  cellphone: string | null
  created_at: string
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  // Add contact form
  const [showAddContact, setShowAddContact] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [addingContact, setAddingContact] = useState(false)

  // Bulk add
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [bulkContacts, setBulkContacts] = useState("")
  const [bulkAdding, setBulkAdding] = useState(false)

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCampaign()
    fetchContacts()
  }, [params.id])

  async function fetchCampaign() {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", params.id)
      .single()

    setCampaign(data)
    setLoading(false)
  }

  async function fetchContacts() {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("campaign_id", params.id)
      .order("created_at", { ascending: false })

    setContacts(data || [])
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    setAddingContact(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    // Create relay token
    const relayToken = nanoid(21)

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        campaign_id: params.id,
        name: newName,
        email: newEmail,
        relay_depth: 0,
        email_sent: false,
        has_relayed: false,
        relay_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.log("[v0] Contact insert error:", error.message)
      setStatusMessage({ type: "error", text: `Failed to save contact: ${error.message}` })
      setAddingContact(false)
      return
    }

    if (contact) {
      // Create relay token
      await supabase.from("relay_tokens").insert({
        token: relayToken,
        campaign_id: params.id,
        contact_id: contact.id,
        sender_name: profile?.full_name || user.email || "Team",
        sender_email: user.email,
      })

      setContacts([contact, ...contacts])
      setNewName("")
      setNewEmail("")
      setShowAddContact(false)

      // Auto-send email
      await sendEmailToContact(contact, relayToken, profile?.full_name || user.email || "Team", user.email || "")
    }

    setAddingContact(false)
  }

  async function handleBulkAdd() {
    setBulkAdding(true)
    const lines = bulkContacts.split("\n").filter(line => line.trim())
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim())
      if (parts.length >= 2) {
        const name = parts[0]
        const email = parts[1]
        
        const relayToken = nanoid(21)

        const { data: contact } = await supabase
          .from("contacts")
          .insert({
            campaign_id: params.id,
            name,
            email,
            relay_depth: 0,
            email_sent: false,
            has_relayed: false,
            relay_count: 0,
          })
          .select()
          .single()

        if (contact) {
          await supabase.from("relay_tokens").insert({
            token: relayToken,
            campaign_id: params.id,
            contact_id: contact.id,
            sender_name: profile?.full_name || user.email || "Team",
            sender_email: user.email,
          })

          await sendEmailToContact(contact, relayToken, profile?.full_name || user.email || "Team", user.email || "")
        }
      }
    }

    await fetchContacts()
    setBulkContacts("")
    setShowBulkAdd(false)
    setBulkAdding(false)
  }

  async function sendEmailToContact(contact: Contact, relayToken: string, senderName: string, senderEmail: string) {
    if (!campaign) return

    setSending(contact.id)
    setStatusMessage(null)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          contactId: contact.id,
          recipientEmail: contact.email,
          recipientName: contact.name,
          senderName: senderName,
          senderEmail: senderEmail || "noreply@relay-it.app",
          subject: campaign.email_subject,
          htmlContent: campaign.email_body,
          eventUrl: campaign.event_url,
          relayToken,
          isRelay: contact.relay_depth > 0,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await supabase
          .from("contacts")
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq("id", contact.id)

        setContacts(prev => 
          prev.map(c => c.id === contact.id ? { ...c, email_sent: true } : c)
        )
        
        setStatusMessage({ type: "success", text: `Email sent to ${contact.email}!` })
      } else {
        setStatusMessage({ type: "error", text: result.error || "Failed to send email" })
      }
    } catch (err) {
      console.error("Failed to send email:", err)
      setStatusMessage({ type: "error", text: "Failed to send email. Check your SMTP settings." })
    }

    setSending(null)
    
    // Clear status message after 5 seconds
    setTimeout(() => setStatusMessage(null), 5000)
  }

  async function activateCampaign() {
    await supabase
    .from("campaigns")
    .update({ status: "active" })
    .eq("id", params.id)
    
    setCampaign(prev => prev ? { ...prev, status: "active" } : null)
  }

  async function handleDeleteCampaign() {
    setDeleting(true)
    // Delete contacts first (FK constraint), then relay tokens, then campaign
    await supabase.from("contacts").delete().eq("campaign_id", params.id)
    await supabase.from("relay_tokens").delete().eq("campaign_id", params.id)
    const { error } = await supabase.from("campaigns").delete().eq("id", params.id)
    if (error) {
      setStatusMessage({ type: "error", text: `Failed to delete: ${error.message}` })
      setDeleting(false)
      setShowDeleteModal(false)
      return
    }
    router.push("/dashboard/campaigns")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard/campaigns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Campaigns
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{campaign.title}</h1>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                campaign.status === "active" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {campaign.status === "draft" && (
              <button
                type="button"
                onClick={activateCampaign}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Activate Campaign
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-destructive/40 text-destructive rounded-lg font-medium hover:bg-destructive/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          statusMessage.type === "success" 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Event URL</p>
          <a href={campaign.event_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate block">
            {campaign.event_url}
          </a>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Contacts</p>
          <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Emails Sent</p>
          <p className="text-2xl font-bold text-foreground">
            {contacts.filter(c => c.status === "sent").length}
          </p>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkAdd(true)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors text-sm"
              >
                Bulk Import
              </button>
              <button
                onClick={() => setShowAddContact(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>

        {/* Add Single Contact Form */}
        {showAddContact && (
          <div className="p-6 border-b border-border bg-accent/30">
            <form onSubmit={handleAddContact} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={addingContact}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {addingContact ? "Adding..." : "Add & Send Email"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Bulk Add Form */}
        {showBulkAdd && (
          <div className="p-6 border-b border-border bg-accent/30">
            <label className="block text-sm font-medium text-foreground mb-2">
              Paste contacts (Name, Email per line)
            </label>
            <textarea
              value={bulkContacts}
              onChange={(e) => setBulkContacts(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
              placeholder="John Doe, john@example.com&#10;Jane Smith, jane@example.com"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleBulkAdd}
                disabled={bulkAdding || !bulkContacts.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {bulkAdding ? "Importing..." : "Import & Send Emails"}
              </button>
              <button
                onClick={() => setShowBulkAdd(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          {contacts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No contacts yet. Add your first contact to start the relay chain.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Depth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        contact.relay_depth === 0 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {contact.relay_depth === 0 ? "Initial" : `Level ${contact.relay_depth}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sending === contact.id
                          ? "bg-yellow-100 text-yellow-700"
                          : contact.email_sent
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {sending === contact.id ? "Sending..." : contact.email_sent ? "Sent" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete Campaign</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-foreground mb-2">
              Are you sure you want to delete <span className="font-semibold">{campaign.title}</span>?
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              All contacts and relay data associated with this campaign will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCampaign}
                disabled={deleting}
                className="px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Campaign"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
