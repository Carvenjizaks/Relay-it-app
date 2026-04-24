"use client"

import { useState } from "react"
import Link from "next/link"

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagResult, setDiagResult] = useState<string | null>(null)

  async function testSmtpConfig() {
    setDiagnosing(true)
    setDiagResult(null)
    try {
      const res = await fetch("/api/test-smtp-config")
      const data = await res.json()
      setDiagResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setDiagResult("Failed to reach diagnostic endpoint")
    }
    setDiagnosing(false)
  }

  async function sendTestEmail() {
    if (!email || !name) {
      setResult({ success: false, message: "Please enter both name and email" })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: `Email sent successfully! Message ID: ${data.messageId}` })
      } else {
        setResult({ success: false, message: data.error || "Failed to send email" })
      }
    } catch (err) {
      setResult({ success: false, message: "Network error - please try again" })
    }

    setSending(false)
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Link 
        href="/dashboard" 
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-foreground mt-4 mb-2">Test Email Sending</h1>
      <p className="text-muted-foreground mb-6">Send a test email to verify your SMTP configuration is working.</p>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Recipient Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Recipient Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="button"
          onClick={sendTestEmail}
          disabled={sending || !email || !name}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? "Sending..." : "Send Test Email"}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            <p className="font-medium">{result.success ? "Success!" : "Error"}</p>
            <p className="text-sm mt-1">{result.message}</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-medium text-foreground">SMTP Diagnostic</h3>
        <p className="text-sm text-muted-foreground">
          Click below to check your SMTP.com API key and channel configuration.
        </p>
        <button
          type="button"
          onClick={testSmtpConfig}
          disabled={diagnosing}
          className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors border border-border"
        >
          {diagnosing ? "Checking..." : "Run SMTP Diagnostic"}
        </button>
        {diagResult && (
          <pre className="mt-2 p-4 bg-background border border-border rounded-lg text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
            {diagResult}
          </pre>
        )}
      </div>
    </div>
  )
}
