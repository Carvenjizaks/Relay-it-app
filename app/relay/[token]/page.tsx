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
    name: string
    description: string
    event_url: string
    event_date: string | null
    event_location: string | null
    email_subject: string
    email_body: string
    cta_text: string
  }
}

export default function RelayPage() {
  const params = useParams()
  const [relayData, setRelayData] = useState<RelayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
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
      // Get current contact's relay depth
      const { data: currentContact } = await supabase
        .from("contacts")
        .select("relay_depth")
        .eq("id", relayData.contact_id)
        .single()

      const newDepth = (currentContact?.relay_depth || 0) + 1

      // Create new contact
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

      // Create new relay token for this recipient
      const newRelayToken = nanoid(21)
      await supabase.from("relay_tokens").insert({
        token: newRelayToken,
        campaign_id: relayData.campaign_id,
        contact_id: newContact.id,
        sender_name: recipientName,
        sender_email: recipientEmail,
      })

      // Send personalized email
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

      // Update contact status
      await supabase
        .from("contacts")
        .update({ status: "sent" })
        .eq("id", newContact.id)

      setSentCount(prev => prev + 1)
      setRecipientName("")
      setRecipientEmail("")
      setSent(true)

      // Reset sent state after 3 seconds to allow adding more
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error && !relayData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!relayData) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-sm text-primary font-medium mb-1">Shared by {relayData.sender_name}</p>
          <h1 className="text-2xl font-bold text-foreground">{relayData.campaign.name}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Campaign Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <p className="text-foreground leading-relaxed mb-6">{relayData.campaign.description}</p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            {relayData.campaign.event_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(relayData.campaign.event_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
            {relayData.campaign.event_location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {relayData.campaign.event_location}
              </div>
            )}
          </div>

          <a
            href={relayData.campaign.event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {relayData.campaign.cta_text || "Learn More"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        {/* Relay Form */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Know Someone Who Would Benefit?
              </h2>
              <p className="text-muted-foreground text-sm">
                Share this opportunity with a friend or colleague. Enter their details below, 
                and we&apos;ll send them a personalized invitation on your behalf.
              </p>
            </div>
          </div>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-green-700">Invitation Sent!</p>
              <p className="text-sm text-green-600 mt-1">
                {sentCount > 1 ? `You've shared this with ${sentCount} people` : "Thank you for sharing"}
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Share with another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleRelay} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Their Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Their Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by Relay-it
        </p>
      </main>
    </div>
  )
}
