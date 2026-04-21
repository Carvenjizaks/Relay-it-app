"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"

interface OrgSettings {
  id?: string
  company_name: string
  company_address: string
  company_city: string
  company_state: string
  company_zip: string
  company_country: string
  sender_name: string
  sender_email: string
  unsubscribe_text: string
}

const defaultSettings: OrgSettings = {
  company_name: "",
  company_address: "",
  company_city: "",
  company_state: "",
  company_zip: "",
  company_country: "United States",
  sender_name: "",
  sender_email: "",
  unsubscribe_text: "If you no longer wish to receive these emails, click here to unsubscribe.",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<OrgSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from("organization_settings")
          .select("*")
          .eq("user_id", user.id)
          .single()
        
        if (data) {
          setSettings(data)
        }
      }
      setLoading(false)
    }
    
    fetchSettings()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to save settings" })
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("organization_settings")
      .upsert({
        ...settings,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      })

    if (error) {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
    } else {
      setMessage({ type: "success", text: "Settings saved successfully!" })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your company details for email footers and compliance
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === "success" 
            ? "bg-success/10 text-success border border-success/20" 
            : "bg-destructive/10 text-destructive border border-destructive/20"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Company Information */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Company Information
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This information will appear in the footer of all your emails for CAN-SPAM compliance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="Acme Corporation"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                type="text"
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                placeholder="123 Main Street, Suite 100"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={settings.company_city}
                onChange={(e) => setSettings({ ...settings, company_city: e.target.value })}
                placeholder="San Francisco"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">State / Province</label>
              <input
                type="text"
                value={settings.company_state}
                onChange={(e) => setSettings({ ...settings, company_state: e.target.value })}
                placeholder="CA"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">ZIP / Postal Code</label>
              <input
                type="text"
                value={settings.company_zip}
                onChange={(e) => setSettings({ ...settings, company_zip: e.target.value })}
                placeholder="94102"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                type="text"
                value={settings.company_country}
                onChange={(e) => setSettings({ ...settings, company_country: e.target.value })}
                placeholder="United States"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
          </div>
        </div>

        {/* Sender Information */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Default Sender
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Default sender information for your email campaigns.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sender Name</label>
              <input
                type="text"
                value={settings.sender_name}
                onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
                placeholder="John Smith"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Sender Email</label>
              <input
                type="email"
                value={settings.sender_email}
                onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
                placeholder="john@company.com"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
          </div>
        </div>

        {/* Unsubscribe Settings */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Unsubscribe Settings
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customize the unsubscribe message that appears at the bottom of your emails.
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-1">Unsubscribe Text</label>
            <textarea
              value={settings.unsubscribe_text}
              onChange={(e) => setSettings({ ...settings, unsubscribe_text: e.target.value })}
              rows={3}
              placeholder="If you no longer wish to receive these emails, click here to unsubscribe."
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The unsubscribe link will automatically be added to this text.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Email Footer Preview
          </h2>
          
          <div className="bg-muted/30 rounded-lg p-6 text-center text-sm text-muted-foreground border border-dashed border-border">
            <p className="mb-2">{settings.company_name || "Your Company Name"}</p>
            <p className="mb-2">
              {settings.company_address || "123 Main Street"}, {settings.company_city || "City"}, {settings.company_state || "State"} {settings.company_zip || "12345"}, {settings.company_country || "Country"}
            </p>
            <p className="mt-4">
              <span className="text-primary underline cursor-pointer">
                {settings.unsubscribe_text || "Click here to unsubscribe"}
              </span>
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
