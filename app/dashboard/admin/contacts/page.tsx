"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"

interface Campaign {
  id: string
  title: string
  email_subject: string
  email_body: string
  event_url: string
}

interface Contact {
  id: string
  name: string
  email: string
  relay_depth: number
  email_sent: boolean
  campaign_id: string
  created_at: string
  campaign: {
    id: string
    title: string
    email_subject: string
    email_body: string
    event_url: string
  }
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  // Email functionality
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<string | null>(null)
  const [bulkSending, setBulkSending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCampaigns()
    fetchContacts()
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [selectedCampaign])

  async function fetchCampaigns() {
    const { data } = await supabase
      .from("campaigns")
      .select("id, title, email_subject, email_body, event_url")
      .order("created_at", { ascending: false })

    setCampaigns(data || [])
  }

  async function fetchContacts() {
    setLoading(true)

    let query = supabase
      .from("contacts")
      .select(`
        *,
        campaign:campaigns(id, title, email_subject, email_body, event_url)
      `)
      .order("created_at", { ascending: false })

    if (selectedCampaign !== "all") {
      query = query.eq("campaign_id", selectedCampaign)
    }

    const { data } = await query
    setContacts(data || [])
    setSelectedIds(new Set())
    setLoading(false)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)))
    }
  }

  async function sendEmailToContact(contact: Contact) {
    if (!contact.campaign) return

    setSending(contact.id)
    setStatusMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    // Get or create relay token
    const { data: tokenRow } = await supabase
      .from("relay_tokens")
      .select("token")
      .eq("contact_id", contact.id)
      .single()

    let token = tokenRow?.token
    if (!token) {
      token = nanoid(21)
      await supabase.from("relay_tokens").insert({
        token,
        campaign_id: contact.campaign_id,
        contact_id: contact.id,
        sender_name: profile?.full_name || user.email || "Team",
        sender_email: user.email,
      })
    }

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: contact.campaign_id,
          contactId: contact.id,
          recipientEmail: contact.email,
          recipientName: contact.name,
          senderName: profile?.full_name || user.email || "Team",
          senderEmail: user.email || "noreply@relay-it.app",
          subject: contact.campaign.email_subject,
          htmlContent: contact.campaign.email_body,
          eventUrl: contact.campaign.event_url,
          relayToken: token,
          isRelay: contact.relay_depth > 0,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await supabase
          .from("contacts")
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq("id", contact.id)

        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, email_sent: true } : c))
        setStatusMessage({ type: "success", text: `Email sent to ${contact.email}!` })
      } else {
        setStatusMessage({ type: "error", text: result.error || "Failed to send email" })
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Failed to send email. Check your SMTP settings." })
    }

    setSending(null)
    setTimeout(() => setStatusMessage(null), 5000)
  }

  async function handleBulkSend() {
    setBulkSending(true)
    const selected = contacts.filter(c => selectedIds.has(c.id))

    for (const contact of selected) {
      await sendEmailToContact(contact)
    }

    setSelectedIds(new Set())
    setBulkSending(false)
    setStatusMessage({ type: "success", text: `Emails sent to ${selected.length} contact${selected.length !== 1 ? "s" : ""}!` })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  function exportToCSV() {
    const headers = ["Name", "Email", "Campaign", "Relay Level", "Email Sent", "Date Added"]
    const rows = contacts.map(c => [
      c.name,
      c.email,
      c.campaign?.title || "",
      c.relay_depth === 0 ? "Initial" : `Level ${c.relay_depth}`,
      c.email_sent ? "Sent" : "Pending",
      new Date(c.created_at).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `contacts-${selectedCampaign === "all" ? "all" : selectedCampaign}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate stats
  const totalContacts = contacts.length
  const emailsSent = contacts.filter(c => c.email_sent).length
  const pending = contacts.filter(c => !c.email_sent).length
  const maxDepth = Math.max(0, ...contacts.map(c => c.relay_depth))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Contacts</h1>
          <p className="text-muted-foreground mt-1">View and export contacts from all campaigns</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={contacts.length === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          statusMessage.type === "success" 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          {statusMessage.type === "success" ? (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Contacts</p>
          <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Emails Sent</p>
          <p className="text-2xl font-bold text-green-600">{emailsSent}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Max Relay Depth</p>
          <p className="text-2xl font-bold text-foreground">{maxDepth}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-foreground">Filter by Campaign:</label>
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.title}
            </option>
          ))}
        </select>
      </div>

      {/* Contacts Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} contact{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={handleBulkSend}
                disabled={bulkSending}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {bulkSending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email to Selected
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No contacts found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === contacts.length && contacts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Depth
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((contact) => (
                  <tr key={contact.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.has(contact.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="rounded border-border cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {contact.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {contact.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {contact.campaign?.title || "Unknown"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        contact.relay_depth === 0
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {contact.relay_depth === 0 ? "Initial" : `Level ${contact.relay_depth}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        sending === contact.id
                          ? "bg-yellow-100 text-yellow-700"
                          : contact.email_sent
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {sending === contact.id ? "Sending..." : contact.email_sent ? "Sent" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => sendEmailToContact(contact)}
                        disabled={sending === contact.id}
                        title={contact.email_sent ? "Resend email" : "Send email"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                      >
                        {sending === contact.id ? (
                          <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                        {contact.email_sent ? "Resend" : "Send"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
