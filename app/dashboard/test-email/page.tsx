"use client"

import { useState } from "react"
import Link from "next/link"

export default function TestDatabasePage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)

  async function testDatabase() {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ 
          success: true, 
          message: "Database connection successful!",
          details: data
        })
      } else {
        setResult({ 
          success: false, 
          message: data.error || "Database connection failed",
          details: data
        })
      }
    } catch (err) {
      setResult({ 
        success: false, 
        message: "Network error - please try again" 
      })
    }

    setTesting(false)
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

      <h1 className="text-2xl font-bold text-foreground mt-4 mb-2">Test Database Connection</h1>
      <p className="text-muted-foreground mb-6">Verify your Supabase database is connected and working properly.</p>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <div>
            <h3 className="font-medium text-foreground">Database Health Check</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This will test the connection to your Supabase database and verify basic operations work.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={testDatabase}
          disabled={testing}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? "Testing..." : "Test Database Connection"}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            <p className="font-medium">{result.success ? "✓ Success!" : "✗ Error"}</p>
            <p className="text-sm mt-1">{result.message}</p>
            {result.details && (
              <pre className="mt-3 p-3 bg-black/5 rounded text-xs overflow-x-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 bg-muted border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-medium text-foreground mb-2">What this tests:</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Supabase client initialization</li>
          <li>Database connectivity</li>
          <li>Basic query execution (SELECT 1)</li>
          <li>Table access (campaigns, contacts)</li>
        </ul>
      </div>
    </div>
  )
}
