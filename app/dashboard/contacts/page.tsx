"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import { nanoid } from "nanoid"

interface ContactList {
  id: string
  name: string
  description: string | null
  contact_count: number
  created_at: string
}

interface Contact {
  id: string
  name: string
  email: string
  cellphone: string | null
  list_id: string | null
  campaign_id: string | null
  relay_depth: number
  email_sent: boolean
  created_at: string
  list?: {
    id: string
    name: string
  }
  campaign?: {
    id: string
    title: string
  }
}

type TabType = "lists" | "contacts"

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("lists")
  const [lists, setLists] = useState<ContactList[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedList, setSelectedList] = useState<ContactList | null>(null)

  // Create list modal
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [creating, setCreating] = useState(false)

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [importTargetList, setImportTargetList] = useState<string>("")
  const [previewData, setPreviewData] = useState<Array<{ name: string; email: string; cellphone: string }>>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Add contact modal
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactName, setNewContactName] = useState("")
  const [newContactEmail, setNewContactEmail] = useState("")
  const [newContactPhone, setNewContactPhone] = useState("")
  const [addingContact, setAddingContact] = useState(false)

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("")
  const [filterList, setFilterList] = useState<string>("all")

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchLists()
    fetchContacts()
  }, [])

  async function fetchLists() {
    const { data } = await supabase
      .from("contact_lists")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (data) setLists(data)
  }

  async function fetchContacts() {
    setLoading(true)
    const { data } = await supabase
      .from("contacts")
      .select(`
        *,
        list:contact_lists(id, name),
        campaign:campaigns(id, title)
      `)
      .order("created_at", { ascending: false })
      .limit(500)
    
    if (data) setContacts(data)
    setLoading(false)
  }

  async function createList() {
    if (!newListName.trim()) return
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }

    const { data, error } = await supabase
      .from("contact_lists")
      .insert({
        name: newListName.trim(),
        description: newListDescription.trim() || null,
        user_id: user.id,
        contact_count: 0,
      })
      .select()
      .single()

    if (error) {
      showStatus("error", error.message)
    } else if (data) {
      setLists([data, ...lists])
      setShowCreateList(false)
      setNewListName("")
      setNewListDescription("")
      showStatus("success", `List "${data.name}" created!`)
    }
    setCreating(false)
  }

  async function deleteList(list: ContactList) {
    if (!confirm(`Delete "${list.name}"? All contacts in this list will be unassigned (not deleted).`)) return

    const { error } = await supabase.from("contact_lists").delete().eq("id", list.id)
    if (error) {
      showStatus("error", error.message)
    } else {
      setLists(lists.filter(l => l.id !== list.id))
      showStatus("success", `List "${list.name}" deleted.`)
    }
  }

  function handleFileUpload(file: File, targetListId?: string) {
    if (!file) return

    const fileExt = file.name.split(".").pop()?.toLowerCase()
    if (!["xlsx", "xls", "csv"].includes(fileExt || "")) {
      showStatus("error", "Please upload an XLSX, XLS, or CSV file.")
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

        const mappedData = jsonData.map((row) => {
          const name = String(row["Name"] || row["name"] || row["Full Name"] || row["full_name"] || row["NAME"] || "").trim()
          const email = String(row["Email"] || row["email"] || row["EMAIL"] || row["E-mail"] || row["e-mail"] || "").trim()
          const cellphone = String(row["Cellphone"] || row["cellphone"] || row["Phone"] || row["phone"] || row["PHONE"] || row["Cell"] || row["cell"] || row["Mobile"] || row["mobile"] || "").trim()
          return { name, email, cellphone }
        }).filter(row => row.name && row.email)

        if (mappedData.length === 0) {
          showStatus("error", "No valid data found. Ensure file has 'Name' and 'Email' columns.")
          return
        }

        setPreviewData(mappedData)
        if (targetListId) setImportTargetList(targetListId)
        setShowImportModal(true)
      } catch {
        showStatus("error", "Failed to read file.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function confirmImport() {
    if (!importTargetList) {
      showStatus("error", "Please select a list to import into.")
      return
    }

    setImporting(true)
    setImportResult(null)

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const contact of previewData) {
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
        list_id: importTargetList,
        relay_depth: 0,
        email_sent: false,
        has_relayed: false,
        relay_count: 0,
      })

      if (error) {
        if (error.code === "23505") {
          errors.push(`Duplicate: ${contact.email}`)
        } else {
          errors.push(`Error: ${contact.email}`)
        }
        failed++
      } else {
        success++
      }
    }

    // Update list contact count
    const { count } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("list_id", importTargetList)

    await supabase
      .from("contact_lists")
      .update({ contact_count: count || 0, updated_at: new Date().toISOString() })
      .eq("id", importTargetList)

    setImportResult({ success, failed, errors: errors.slice(0, 10) })
    setImporting(false)

    if (success > 0) {
      fetchLists()
      fetchContacts()
      showStatus("success", `Imported ${success} contacts!`)
    }

    setTimeout(() => {
      setShowImportModal(false)
      setPreviewData([])
      setImportResult(null)
    }, 2000)
  }

  async function addContact() {
    if (!newContactName.trim() || !newContactEmail.trim()) return
    setAddingContact(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newContactEmail)) {
      showStatus("error", "Please enter a valid email address.")
      setAddingContact(false)
      return
    }

    const { error } = await supabase.from("contacts").insert({
      name: newContactName.trim(),
      email: newContactEmail.toLowerCase().trim(),
      cellphone: newContactPhone.trim() || null,
      list_id: selectedList?.id || null,
      relay_depth: 0,
      email_sent: false,
      has_relayed: false,
      relay_count: 0,
    })

    if (error) {
      console.error("[Add Contact Error]", error)
      showStatus("error", error.code === "23505" ? "This email already exists." : `Error: ${error.message} (Code: ${error.code})`)
    } else {
      fetchContacts()
      if (selectedList) {
        await supabase
          .from("contact_lists")
          .update({ contact_count: (selectedList.contact_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq("id", selectedList.id)
        fetchLists()
      }
      setShowAddContact(false)
      setNewContactName("")
      setNewContactEmail("")
      setNewContactPhone("")
      showStatus("success", "Contact added!")
    }
    setAddingContact(false)
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return
    const contact = contacts.find(c => c.id === id)
    
    await supabase.from("contacts").delete().eq("id", id)
    setContacts(contacts.filter(c => c.id !== id))

    if (contact?.list_id) {
      const list = lists.find(l => l.id === contact.list_id)
      if (list) {
        await supabase
          .from("contact_lists")
          .update({ contact_count: Math.max(0, (list.contact_count || 1) - 1), updated_at: new Date().toISOString() })
          .eq("id", list.id)
        fetchLists()
      }
    }
  }

  function exportList(list: ContactList) {
    const listContacts = contacts.filter(c => c.list_id === list.id)
    if (listContacts.length === 0) {
      showStatus("error", "No contacts in this list to export.")
      return
    }

    const headers = ["Name", "Email", "Cellphone"]
    const rows = listContacts.map(c => [c.name, c.email, c.cellphone || ""])
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${list.name.replace(/[^a-z0-9]/gi, "_")}_contacts.csv`
    a.click()
    URL.revokeObjectURL(url)
    showStatus("success", `Exported ${listContacts.length} contacts.`)
  }

  function exportAllContacts() {
    if (filteredContacts.length === 0) {
      showStatus("error", "No contacts to export.")
      return
    }

    const headers = ["Name", "Email", "Cellphone", "List", "Campaign", "Status"]
    const rows = filteredContacts.map(c => [
      c.name,
      c.email,
      c.cellphone || "",
      c.list?.name || "",
      c.campaign?.title || "",
      c.email_sent ? "Sent" : "Pending"
    ])
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "all_contacts.csv"
    a.click()
    URL.revokeObjectURL(url)
    showStatus("success", `Exported ${filteredContacts.length} contacts.`)
  }

  function showStatus(type: "success" | "error", text: string) {
    setStatusMessage({ type, text })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  function handleDrop(e: React.DragEvent, listId?: string) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0], listId)
  }

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.cellphone?.includes(searchQuery))
    const matchesList = filterList === "all" || c.list_id === filterList || (filterList === "none" && !c.list_id)
    return matchesSearch && matchesList
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">Create lists, import contacts, and manage your audience</p>
        </div>
      </div>

      {/* Status */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          statusMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {statusMessage.type === "success"
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
          </svg>
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("lists")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "lists" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lists
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "contacts" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Contacts
        </button>
      </div>

      {/* Lists Tab */}
      {activeTab === "lists" && (
        <div>
          {/* Create List Button */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">{lists.length} list{lists.length !== 1 ? "s" : ""}</p>
            <button
              type="button"
              onClick={() => setShowCreateList(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create List
            </button>
          </div>

          {/* Lists Grid */}
          {lists.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No contact lists yet</h3>
              <p className="text-muted-foreground mb-4">Create your first list to organize your contacts.</p>
              <button
                type="button"
                onClick={() => setShowCreateList(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create List
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map(list => (
                <div
                  key={list.id}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
                  onDragOver={handleDrag}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={(e) => handleDrop(e, list.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => exportList(list)}
                        title="Export list"
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteList(list)}
                        title="Delete list"
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{list.contact_count || 0}</span>
                    <span className="text-sm text-muted-foreground">contacts</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], list.id)}
                      />
                      <span className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedList(list)
                        setShowAddContact(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div>
          {/* Filters */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
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
                value={filterList}
                onChange={(e) => setFilterList(e.target.value)}
                className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Lists</option>
                <option value="none">No List</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={exportAllContacts}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedList(null)
                  setShowAddContact(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contact
              </button>
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">List</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading...</td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        {searchQuery || filterList !== "all" ? "No contacts match your filters" : "No contacts yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{contact.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{contact.email}</td>
                        <td className="px-6 py-4 text-muted-foreground">{contact.cellphone || "-"}</td>
                        <td className="px-6 py-4">
                          {contact.list ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {contact.list.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Sent</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => deleteContact(contact.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
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
                <p className="text-sm text-muted-foreground">Showing {filteredContacts.length} contacts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Create Contact List</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">List Name *</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Newsletter Subscribers"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowCreateList(false)} className="flex-1 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-colors">Cancel</button>
              <button
                type="button"
                onClick={createList}
                disabled={creating || !newListName.trim()}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create List"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-foreground mb-1">Add Contact</h2>
            {selectedList && <p className="text-sm text-muted-foreground mb-4">Adding to: {selectedList.name}</p>}
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowAddContact(false)} className="flex-1 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-colors">Cancel</button>
              <button
                type="button"
                onClick={addContact}
                disabled={addingContact || !newContactName.trim() || !newContactEmail.trim()}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {addingContact ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Import Preview</h2>
              <p className="text-sm text-muted-foreground mt-1">{previewData.length} contacts ready to import</p>
            </div>

            <div className="p-6 space-y-4">
              {!importTargetList && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Select List *</label>
                  <select
                    value={importTargetList}
                    onChange={(e) => setImportTargetList(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Choose a list...</option>
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Name</th>
                      <th className="text-left px-4 py-2 font-medium">Email</th>
                      <th className="text-left px-4 py-2 font-medium">Phone</th>
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

              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.failed > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
                  <p className="font-medium">{importResult.success} imported, {importResult.failed} failed</p>
                  {importResult.errors.length > 0 && (
                    <ul className="text-sm mt-2 space-y-1">
                      {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setPreviewData([]); setImportResult(null) }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={importing || !importTargetList}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
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
