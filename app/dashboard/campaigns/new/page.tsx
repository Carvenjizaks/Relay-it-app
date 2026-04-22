"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { EmailEditor } from "@/components/email-editor"

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

  // Email Mode: AI-generated or pre-written
  const [emailMode, setEmailMode] = useState<"ai" | "manual">("ai")
  
  // Manual email fields
  const [manualSubject, setManualSubject] = useState("")
  const [manualBody, setManualBody] = useState("")

  // Step 2: AI Generation Questions
  const [targetAudience, setTargetAudience] = useState("")
  const [tone, setTone] = useState("professional")
  const [keyBenefits, setKeyBenefits] = useState("")
  const [callToAction, setCallToAction] = useState("Register Now")

  // Step 3: Generated Email
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [relayMessage, setRelayMessage] = useState("Know someone who would love this? Share it with them!")

  function handleUseManualEmail() {
    setGeneratedEmail({
      subject: manualSubject,
      greeting: "",
      body: manualBody,
      callToActionText: callToAction,
      relaySection: "",
      closing: "",
    })
    setEditedSubject(manualSubject)
    setEditedBody(manualBody)
    setStep(3)
  }

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
    console.log("[v0] handleCreateCampaign called")
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      console.log("[v0] User:", user?.id)

      if (!user) {
        setError("You must be logged in")
        setLoading(false)
        return
      }

      console.log("[v0] Inserting campaign:", { name, description, eventUrl })
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          title: name,
          description,
          event_url: eventUrl,
          event_date: eventDate ? new Date(eventDate).toISOString() : null,
          event_location: eventLocation || null,
          target_audience: targetAudience || null,
          tone,
          key_benefits: keyBenefits || null,
          email_subject: editedSubject,
          email_body: editedBody,
          call_to_action: generatedEmail?.callToActionText || callToAction,
          relay_message: relayMessage,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single()

      if (error) {
        console.log("[v0] Error creating campaign:", error.message)
        setError(error.message)
        setLoading(false)
        return
      }

      console.log("[v0] Campaign created:", data.id)
      router.push(`/dashboard/campaigns/${data.id}`)
    } catch (err) {
      console.log("[v0] Exception:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/dashboard/campaigns" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold text-foreground mt-4">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Set up your campaign and let AI generate personalized emails
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-3 mb-8 p-4 bg-card border border-border rounded-2xl">
        {[
          { num: 1, label: "Details", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          { num: 2, label: "AI Settings", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
          { num: 3, label: "Review", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`flex items-center gap-3 flex-1 px-4 py-2.5 rounded-xl transition-all ${
              step === s.num 
                ? "bg-gradient-to-r from-primary to-warning text-white shadow-lg shadow-primary/25" 
                : step > s.num 
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground"
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                step === s.num ? "bg-white/20" : step > s.num ? "bg-success/20" : "bg-muted-foreground/10"
              }`}>
                {step > s.num ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                )}
              </div>
              <span className="font-medium text-sm hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && (
              <div className={`w-8 h-0.5 mx-1 ${step > s.num ? "bg-success" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* TEST BUTTON - Remove after debugging */}
      <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">Debug: Click this test button to verify JavaScript is working:</p>
        <button
          type="button"
          onClick={() => {
            alert("Button clicked! JavaScript is working.")
            setStep(2)
          }}
          className="px-4 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600"
        >
          TEST CLICK ME
        </button>
        <p className="text-xs text-yellow-700 mt-2">Current step: {step} | Name: {name || "(empty)"} | Description: {description || "(empty)"} | URL: {eventUrl || "(empty)"}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-muted-foreground"
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
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
                  className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                  placeholder="e.g., San Francisco, CA or Virtual"
                />
              </div>
            </div>

            {/* Email Mode Selection */}
            <div className="border-t border-border pt-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Email Content
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setEmailMode("ai")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    emailMode === "ai"
                      ? "border-primary bg-gradient-to-br from-primary/10 to-warning/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    emailMode === "ai" ? "bg-gradient-to-br from-primary to-warning" : "bg-muted"
                  }`}>
                    <svg className={`w-6 h-6 ${emailMode === "ai" ? "text-white" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-foreground block mb-1">AI Generated</span>
                  <p className="text-xs text-muted-foreground">
                    Let AI create personalized emails based on your campaign details
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailMode("manual")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    emailMode === "manual"
                      ? "border-primary bg-gradient-to-br from-primary/10 to-warning/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    emailMode === "manual" ? "bg-gradient-to-br from-primary to-warning" : "bg-muted"
                  }`}>
                    <svg className={`w-6 h-6 ${emailMode === "manual" ? "text-white" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-foreground block mb-1">Paste Pre-Written</span>
                  <p className="text-xs text-muted-foreground">
                    Use your own pre-written email content
                  </p>
                </button>
              </div>
            </div>

            {/* Manual Email Input (shown when manual mode selected) */}
            {emailMode === "manual" && (
              <div className="space-y-4 bg-accent/30 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                    placeholder="Enter your email subject line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Body *
                  </label>
                  <EmailEditor
                    value={manualBody}
                    onChange={setManualBody}
                    placeholder="Start writing your email...

Use {{recipient_name}} for the recipient's name
Use {{sender_name}} for the sender's name"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use {"{{recipient_name}}"} and {"{{sender_name}}"} as placeholders for personalization. The editor supports Substack-style formatting with bold, italic, headings, links, and more.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              {emailMode === "ai" ? (
                <button
                  type="button"
                  onClick={() => {
                    console.log("[v0] Next AI Settings clicked, setting step to 2")
                    setStep(2)
                  }}
                  disabled={!name || !description || !eventUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-warning text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5"
                >
                  Next: AI Settings
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    console.log("[v0] Next Review Email clicked")
                    handleUseManualEmail()
                  }}
                  disabled={!name || !description || !eventUrl || !manualSubject || !manualBody}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-warning text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5"
                >
                  Next: Review Email
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-muted-foreground"
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                placeholder="e.g., Register Now, Get Your Ticket, Join Us"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-medium hover:bg-accent transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={handleGenerateEmail}
                disabled={generating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-warning text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating Email...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Body
              </label>
              <EmailEditor
                value={editedBody}
                onChange={setEditedBody}
                placeholder="Edit your email content..."
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use {"{{recipient_name}}"} and {"{{sender_name}}"} as placeholders. Format your email with the toolbar above.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-warning/5 rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h4 className="font-semibold text-foreground">Email Preview</h4>
              </div>
              <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="font-medium">Subject:</span>
                </div>
                <p className="font-semibold text-foreground mb-4 pb-4 border-b border-border">
                  {editedSubject.replace("{{recipient_name}}", "John")}
                </p>
                <div 
                  className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2
                    [&_p]:mb-3 [&_a]:text-primary [&_a]:underline
                    [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  dangerouslySetInnerHTML={{ 
                    __html: editedBody
                      .replace(/\{\{recipient_name\}\}/g, "John")
                      .replace(/\{\{sender_name\}\}/g, "Sarah") 
                  }}
                />
                
                {/* Relay-it Section */}
                <div className="mt-6 pt-6 border-t border-dashed border-border">
                  <div className="bg-gradient-to-r from-primary/10 via-info/10 to-primary/10 rounded-xl p-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="font-bold text-primary">Relay-it</span>
                    </div>
                    <p className="text-sm text-foreground mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {relayMessage}
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm cursor-pointer hover:bg-primary/90 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send this to a friend
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Relay Message Customization */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Relay-it Message
              </label>
              <input
                type="text"
                value={relayMessage}
                onChange={(e) => setRelayMessage(e.target.value)}
                placeholder="Customize the sharing message..."
                className="w-full px-4 py-3 bg-card text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This message appears above the &quot;Send this to a friend&quot; button in every email
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(emailMode === "ai" ? 2 : 1)}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-medium hover:bg-accent transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateCampaign}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-warning text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
