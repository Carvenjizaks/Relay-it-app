"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface ContactList {
  id: string
  name: string
  contact_count: number
}

interface Contact {
  id: string
  name: string
  email: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [eventUrl, setEventUrl] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [relayMessage, setRelayMessage] = useState("Know someone who would love this? Share it with them!")

  // Contact list selection
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [listContacts, setListContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchContactLists()
  }, [])

  useEffect(() => {
    if (selectedListId) {
      fetchListContacts(selectedListId)
    } else {
      setListContacts([])
    }
  }, [selectedListId])

  async function fetchContactLists() {
    const { data } = await supabase
      .from("contact_lists")
      .select("id, name, contact_count")
      .order("name", { ascending: true })
    if (data) setContactLists(data)
  }

  async function fetchListContacts(listId: string) {
    setLoadingContacts(true)
    const { data } = await supabase
      .from("contacts")
      .select("id, name, email")
      .eq("list_id", listId)
      .order("name", { ascending: true })
    if (data) setListContacts(data)
    setLoadingContacts(false)
  }

  async function handleCreateCampaign() {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        setLoading(false)
        return
      }

      // Create campaign
      const { data: campaign, error: insertError } = await supabase
        .from("campaigns")
        .insert({
          title: name,
          description,
          event_url: eventUrl,
          email_subject: emailSubject,
          email_body: emailBody,
          relay_message: relayMessage,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // If a list was selected, copy contacts to the campaign
      if (selectedListId && listContacts.length > 0) {
        const contactsToInsert = listContacts.map(c => ({
          name: c.name,
          email: c.email,
          campaign_id: campaign.id,
          list_id: selectedListId,
          relay_depth: 0,
          email_sent: false,
          has_relayed: false,
          relay_count: 0,
        }))

        const { error: contactsError } = await supabase
          .from("contacts")
          .insert(contactsToInsert)

        if (contactsError) {
          console.error("Error adding contacts:", contactsError)
        }
      }

      router.push(`/dashboard/campaigns/${campaign.id}`)
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/campaigns" 
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Create New Campaign</h1>
        <p className="text-muted-foreground">Step {step} of 3</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Campaign Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Sale Announcement"
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your campaign..."
                rows={3}
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event/Landing Page URL *
              </label>
              <input
                type="url"
                value={eventUrl}
                onChange={(e) => setEventUrl(e.target.value)}
                placeholder="https://example.com/event"
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!name || !description || !eventUrl}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next: Email Content
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Email Content */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Email Content</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Subject *
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g., You're Invited to Our Summer Sale!"
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Body *
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your email content here..."
                rows={8}
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Relay-it Message
              </label>
              <input
                type="text"
                value={relayMessage}
                onChange={(e) => setRelayMessage(e.target.value)}
                placeholder="Message shown above the share button..."
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This appears above the &quot;Send this to a friend&quot; button
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!emailSubject || !emailBody}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next: Select Contacts
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Contact List */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Select Contacts</h2>
            <p className="text-sm text-muted-foreground">
              Choose a contact list to add to this campaign. You can also add individual contacts after creation.
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contact List
              </label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No list selected (add contacts later)</option>
                {contactLists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.contact_count} contacts)
                  </option>
                ))}
              </select>
              {contactLists.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No contact lists found.{" "}
                  <Link href="/dashboard/contacts" className="text-primary hover:underline">
                    Create a list first
                  </Link>
                </p>
              )}
            </div>

            {/* Preview selected contacts */}
            {selectedListId && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {loadingContacts ? "Loading..." : `${listContacts.length} contacts in this list`}
                  </span>
                </div>
                {!loadingContacts && listContacts.length > 0 && (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {listContacts.slice(0, 20).map(contact => (
                          <tr key={contact.id}>
                            <td className="px-4 py-2 text-foreground">{contact.name}</td>
                            <td className="px-4 py-2 text-muted-foreground">{contact.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {listContacts.length > 20 && (
                      <div className="px-4 py-2 text-center text-sm text-muted-foreground bg-muted/30">
                        ... and {listContacts.length - 20} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateCampaign}
                disabled={loading}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
