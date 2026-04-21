"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"

interface Contact {
  id: string
  name: string
  email: string
  cellphone: string | null
  campaign_id: string | null
  relay_depth: number
  email_sent: boolean
  created_at: string
  campaign?: {
    id: string
    title: string
  }
}

interface Campaign {
  id: string
  title: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCampaign, setFilterCampaign] = useState<string>("all")
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [previewData, setPreviewData] = useState<Array<{ name: string; email: string; cellphone: string }>>([])
  const [dragActive, setDragActive] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Memoize supabase client to prevent recreation
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      
      const [contactsRes, campaignsRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("*, campaign:campaigns!contacts_campaign_id_fkey(id, title)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("campaigns")
          .select("id, title")
          .order("title", { ascending: true })
      ])

      if (contactsRes.data) setContacts(contactsRes.data)
      if (campaignsRes.data) setCampaigns(campaignsRes.data)
      
      setLoading(false)
    }
    
    fetchData()
  }, [supabase, refetchTrigger])

  const handleFileUpload = async (file: File) => {
    if (!file) return

    const fileExt = file.name.split(".").pop()?.toLowerCase()
    
    if (!["xlsx", "xls", "csv"].includes(fileExt || "")) {
      setImportResult({ success: 0, failed: 0, errors: ["Please upload an XLSX, XLS, or CSV file."] })
      return
    }

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

      // Map columns - flexible matching
      const mappedData = jsonData.map((row) => {
        const name = String(row["Name"] || row["name"] || row["Full Name"] || row["full_name"] || row["NAME"] || "").trim()
        const email = String(row["Email"] || row["email"] || row["EMAIL"] || row["E-mail"] || row["e-mail"] || "").trim()
        const cellphone = String(row["Cellphone"] || row["cellphone"] || row["Phone"] || row["phone"] || row["PHONE"] || row["Cell"] || row["cell"] || row["Mobile"] || row["mobile"] || "").trim()
        
        return { name, email, cellphone }
      }).filter(row => row.name && row.email) // Filter out empty rows

      if (mappedData.length === 0) {
        setImportResult({ 
          success: 0, 
          failed: 0, 
          errors: ["No valid data found. Please ensure your file has 'Name' and 'Email' columns."] 
        })
        return
      }

      setPreviewData(mappedData)
      setShowImportModal(true)
    } catch {
      setImportResult({ success: 0, failed: 0, errors: ["Failed to read file. Please check the format."] })
    }
  }

  const confirmImport = async () => {
    if (!selectedCampaign) {
      setImportResult({ success: 0, failed: 0, errors: ["Please select a campaign to import contacts into."] })
      return
    }

    setImporting(true)
    setImportResult(null)

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const contact of previewData) {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contact.email)) {
        errors.push(`Invalid email: ${contact.email}`)
        failed++
        continue
      }

      const { error } = await supabase.from("contacts").insert({
        name: contact.name,
        email: contact.email.toLowerCase(),
        cellphone: contact.cellphone || null,
        campaign_id: selectedCampaign,
        relay_depth: 0,
        email_sent: false,
        has_relayed: false,
        relay_count: 0
      })

      if (error) {
        if (error.code === "23505") {
          errors.push(`Duplicate email: ${contact.email}`)
        } else {
          errors.push(`Error importing ${contact.email}: ${error.message}`)
        }
        failed++
      } else {
        success++
      }
    }

    setImportResult({ success, failed, errors: errors.slice(0, 10) })
    setImporting(false)
    setShowImportModal(false)
    setPreviewData([])
    
    if (success > 0) {
      setRefetchTrigger(prev => prev + 1)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.cellphone && contact.cellphone.includes(searchQuery))
    
    const matchesCampaign = filterCampaign === "all" || contact.campaign_id === filterCampaign
    
    return matchesSearch && matchesCampaign
  })

  const deleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return
    
    await supabase.from("contacts").delete().eq("id", id)
    setContacts(contacts.filter(c => c.id !== id))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">Import and manage your contacts for email campaigns</p>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Import Contacts</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-foreground font-medium mb-1">Drop your file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="file-upload"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choose File
            </label>
            <p className="text-xs text-muted-foreground mt-3">Supports XLSX, XLS, and CSV files</p>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-xl p-6">
            <h3 className="font-medium text-foreground mb-3">File Format</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your file should have the following columns:
            </p>
            <div className="bg-card rounded-lg p-4 font-mono text-sm border border-border">
              <div className="grid grid-cols-3 gap-4 text-muted-foreground">
                <span>Name</span>
                <span>Email</span>
                <span>Cellphone</span>
              </div>
              <div className="border-t border-border my-2"></div>
              <div className="grid grid-cols-3 gap-4 text-foreground">
                <span>John Doe</span>
                <span>john@example.com</span>
                <span>+1234567890</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-foreground">
                <span>Jane Smith</span>
                <span>jane@example.com</span>
                <span>+0987654321</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Column names are flexible (e.g., &quot;Phone&quot;, &quot;Mobile&quot;, &quot;Cell&quot; all work for cellphone)
            </p>
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            importResult.failed > 0 ? "bg-warning/10 border border-warning/30" : "bg-success/10 border border-success/30"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.success > 0 && (
                <span className="text-success font-medium">{importResult.success} contacts imported</span>
              )}
              {importResult.failed > 0 && (
                <span className="text-warning font-medium">{importResult.failed} failed</span>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <ul className="text-sm text-muted-foreground space-y-1">
                {importResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cellphone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Loading contacts...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery || filterCampaign !== "all" 
                      ? "No contacts match your filters" 
                      : "No contacts yet. Import some above!"}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{contact.name}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{contact.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{contact.cellphone || "-"}</td>
                    <td className="px-6 py-4">
                      {contact.campaign ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {contact.campaign.title}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {contact.email_sent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete contact"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredContacts.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {filteredContacts.length} of {contacts.length} contacts
            </p>
          </div>
        )}
      </div>

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Preview Import</h2>
              <p className="text-muted-foreground mt-1">{previewData.length} contacts ready to import</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Campaign *
                </label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Choose a campaign...</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                  ))}
                </select>
              </div>

              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Name</th>
                      <th className="text-left px-4 py-2 font-medium">Email</th>
                      <th className="text-left px-4 py-2 font-medium">Cellphone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.slice(0, 50).map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2">{row.cellphone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 50 && (
                  <div className="px-4 py-2 text-center text-muted-foreground text-sm bg-muted/30">
                    ... and {previewData.length - 50} more
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setPreviewData([])
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importing || !selectedCampaign}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? "Importing..." : `Import ${previewData.length} Contacts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
