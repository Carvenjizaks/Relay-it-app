"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface GeneratedEmail {
  subject: string
  greeting: string
  body: string
  callToActionText: string
  relaySection: string
  closing: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Basic Info
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [eventUrl, setEventUrl] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventLocation, setEventLocation] = useState("")

  // Step 2: AI Generation Questions
  const [targetAudience, setTargetAudience] = useState("")
  const [tone, setTone] = useState("professional")
  const [keyBenefits, setKeyBenefits] = useState("")
  const [callToAction, setCallToAction] = useState("Register Now")

  // Step 3: Generated Email
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")

  async function handleGenerateEmail() {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: name,
          description,
          eventUrl,
          eventDate,
          eventLocation,
          targetAudience,
          tone,
          keyBenefits,
          callToAction,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate email")
      }

      const data = await response.json()
      setGeneratedEmail(data.email)
      setEditedSubject(data.email.subject)
      setEditedBody(`${data.email.greeting}\n\n${data.email.body}\n\n${data.email.closing}`)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email")
    } finally {
      setGenerating(false)
    }
  }

  async function handleCreateCampaign() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        name,
        description,
        event_url: eventUrl,
        event_date: eventDate ? new Date(eventDate).toISOString() : null,
        event_location: eventLocation || null,
        target_audience: targetAudience || null,
        tone,
        key_benefits: keyBenefits || null,
        email_subject: editedSubject,
        email_body: editedBody,
        cta_text: generatedEmail?.callToActionText || callToAction,
        created_by: user.id,
        status: "draft",
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/campaigns/${data.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/campaigns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-4">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">
          AI will generate personalized emails based on your campaign details
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
        <div className="ml-4 text-sm text-muted-foreground">
          {step === 1 && "Campaign Details"}
          {step === 2 && "AI Generation Settings"}
          {step === 3 && "Review & Create"}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Tech Summit 2024 Launch"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description / Event Details *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Describe your event, product launch, or campaign in detail. The more context you provide, the better the AI-generated email will be."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event/Registration URL *
              </label>
              <input
                type="url"
                value={eventUrl}
                onChange={(e) => setEventUrl(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/register"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This link will be included in every email for recipients to register, buy, or join
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Date
                </label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., San Francisco, CA or Virtual"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!name || !description || !eventUrl}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next: AI Settings
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Generation Questions */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Audience
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Software developers, Marketing professionals, Business owners"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Who is this campaign targeting? This helps personalize the message.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly & Casual</option>
                <option value="urgent">Urgent & Action-Oriented</option>
                <option value="inspiring">Inspiring & Motivational</option>
                <option value="exclusive">Exclusive & VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Key Benefits / Highlights
              </label>
              <textarea
                value={keyBenefits}
                onChange={(e) => setKeyBenefits(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="List the main benefits or highlights of attending/participating..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Call to Action Text
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Register Now, Get Your Ticket, Join Us"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerateEmail}
                disabled={generating}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Email...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Email with AI
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && generatedEmail && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Body
              </label>
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use {"{{recipient_name}}"} and {"{{sender_name}}"} as placeholders
              </p>
            </div>

            <div className="bg-accent/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Preview</h4>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                <p className="font-medium mb-4">{editedSubject.replace("{{recipient_name}}", "John")}</p>
                <p className="text-xs text-muted-foreground mb-1">Body:</p>
                <div className="text-sm whitespace-pre-wrap">
                  {editedBody.replace(/\{\{recipient_name\}\}/g, "John").replace(/\{\{sender_name\}\}/g, "Sarah")}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={loading}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creating..." : "Create Campaign"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
