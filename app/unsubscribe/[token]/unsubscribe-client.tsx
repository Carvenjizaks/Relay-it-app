"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Contact {
  id: string
  name: string
  email: string
  unsubscribed: boolean
  campaign: {
    title: string
  } | null
}

export function UnsubscribeClient({ contact, token }: { contact: Contact; token: string }) {
  const [status, setStatus] = useState<"pending" | "processing" | "success" | "error">(
    contact.unsubscribed ? "success" : "pending"
  )
  const [alreadyUnsubscribed] = useState(contact.unsubscribed)

  async function handleUnsubscribe() {
    setStatus("processing")
    
    const supabase = createClient()
    const { error } = await supabase
      .from("contacts")
      .update({ 
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString()
      })
      .eq("id", token)

    if (error) {
      setStatus("error")
    } else {
      setStatus("success")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {status === "pending" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Unsubscribe from emails
              </h1>
              <p className="text-muted-foreground mb-6">
                You are about to unsubscribe <strong>{contact.email}</strong> from 
                {contact.campaign ? ` "${contact.campaign.title}"` : " our emails"}.
              </p>
              
              <button
                onClick={handleUnsubscribe}
                className="w-full px-6 py-3 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/90 transition-colors"
              >
                Yes, Unsubscribe Me
              </button>
              
              <p className="text-xs text-muted-foreground mt-4">
                You will no longer receive emails from this campaign.
              </p>
            </>
          )}

          {status === "processing" && (
            <>
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Processing...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we update your preferences.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {alreadyUnsubscribed ? "Already Unsubscribed" : "Successfully Unsubscribed"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {alreadyUnsubscribed 
                  ? `${contact.email} was already unsubscribed from this mailing list.`
                  : `${contact.email} has been removed from our mailing list. You will no longer receive emails from this campaign.`
                }
              </p>
              
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p>
                  If you unsubscribed by mistake, please contact the sender to be re-added to the mailing list.
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                We couldn&apos;t process your unsubscribe request. Please try again or contact support.
              </p>
              
              <button
                onClick={handleUnsubscribe}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <span className="font-semibold">Relay-it</span>
        </p>
      </div>
    </div>
  )
}
