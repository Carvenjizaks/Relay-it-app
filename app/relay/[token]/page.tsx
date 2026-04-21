"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"

interface RelayData {
  token: string
  campaign_id: string
  contact_id: string
  sender_name: string
  sender_email: string
  campaign: {
    id: string
    title: string
    description: string
    event_url: string
    event_date: string | null
    event_location: string | null
    email_subject: string
    email_body: string
    call_to_action: string
  }
}

export default function RelayPage() {
  const params = useParams()
  const [relayData, setRelayData] = useState<RelayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentCount, setSentCount] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchRelayData()
  }, [params.token])

  async function fetchRelayData() {
    const { data, error } = await supabase
      .from("relay_tokens")
      .select(`
        *,
        campaign:campaigns(*)
      `)
      .eq("token", params.token)
      .single()

    if (error || !data) {
      setError("Invalid or expired relay link")
      setLoading(false)
      return
    }

    setRelayData(data as unknown as RelayData)
    setLoading(false)
  }

  async function handleRelay(e: React.FormEvent) {
    e.preventDefault()
    if (!relayData) return

    setSending(true)
    setError(null)

    try {
      const { data: currentContact } = await supabase
        .from("contacts")
        .select("relay_depth")
        .eq("id", relayData.contact_id)
        .single()

      const newDepth = (currentContact?.relay_depth || 0) + 1

      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          campaign_id: relayData.campaign_id,
          name: recipientName,
          email: recipientEmail,
          relay_depth: newDepth,
          referred_by_contact_id: relayData.contact_id,
          referred_by_name: relayData.sender_name,
          referred_by_email: relayData.sender_email,
          status: "pending",
        })
        .select()
        .single()

      if (contactError) {
        throw new Error("Failed to add contact")
      }

      const newRelayToken = nanoid(21)
      await supabase.from("relay_tokens").insert({
        token: newRelayToken,
        campaign_id: relayData.campaign_id,
        contact_id: newContact.id,
        sender_name: recipientName,
        sender_email: recipientEmail,
      })

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: relayData.campaign_id,
          contactId: newContact.id,
          recipientEmail,
          recipientName,
          senderName: relayData.sender_name,
          senderEmail: relayData.sender_email,
          subject: relayData.campaign.email_subject,
          htmlContent: relayData.campaign.email_body,
          eventUrl: relayData.campaign.event_url,
          relayToken: newRelayToken,
          isRelay: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      await supabase
        .from("contacts")
        .update({ status: "sent" })
        .eq("id", newContact.id)

      setSentCount(prev => prev + 1)
      setRecipientName("")
      setRecipientEmail("")
      setSent(true)

      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-warning rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !relayData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-md shadow-xl">
          <div className="w-20 h-20 bg-destructive/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Invalid Link</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!relayData) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Header */}
      <header className="bg-gradient-to-br from-primary/10 via-warning/5 to-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-warning rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
              Relay-it
            </span>
          </div>
          <p className="text-sm font-medium text-primary mb-2">
            Shared by {relayData.sender_name}
          </p>
          <h1 className="text-3xl font-bold text-foreground">{relayData.campaign.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Campaign Info Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <p className="text-foreground leading-relaxed mb-6 text-lg">
            {relayData.campaign.description}
          </p>
          
          {(relayData.campaign.event_date || relayData.campaign.event_location) && (
            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-border">
              {relayData.campaign.event_date && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-primary/10 rounded-xl">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-primary">
                    {new Date(relayData.campaign.event_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {relayData.campaign.event_location && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-info/10 rounded-xl">
                  <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-info">
                    {relayData.campaign.event_location}
                  </span>
                </div>
              )}
            </div>
          )}

          <a
            href={relayData.campaign.event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-warning text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5"
          >
            {relayData.campaign.call_to_action || "Learn More"}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        {/* Relay Form Card */}
        <div className="bg-gradient-to-br from-primary/5 via-warning/5 to-card border border-primary/20 rounded-2xl p-6 shadow-lg shadow-primary/5">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-warning/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Know Someone Who Would Benefit?
              </h2>
              <p className="text-muted-foreground">
                Share this opportunity with a friend or colleague. Enter their details below, 
                and we&apos;ll send them a personalized invitation on your behalf.
              </p>
            </div>
          </div>

          {sent ? (
            <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-success mb-1">Invitation Sent!</p>
              <p className="text-sm text-success/80 mb-4">
                {sentCount > 1 ? `You've shared this with ${sentCount} people` : "Thank you for sharing"}
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Share with another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleRelay} className="space-y-4">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Their Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-card text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Their Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-card text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary to-warning text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>
            <span className="font-semibold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
              Relay-it
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
