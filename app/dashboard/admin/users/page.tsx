"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  referral_code: string | null
  total_referrals: number | null
  total_credits: number | null
  role: string | null
  created_at: string | null
}

type Role = "admin" | "manager" | "user"

const ROLES: Role[] = ["admin", "manager", "user"]

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full access to all features and settings.",
  manager: "Can create campaigns and manage contacts.",
  user: "Can view campaigns and relay emails only.",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState("all")
  const [search, setSearch] = useState("")

  // Edit modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState<Role>("user")
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Role>("admin")
  const [inviteName, setInviteName] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  function openEdit(user: UserProfile) {
    setEditingUser(user)
    setEditName(user.full_name || "")
    setEditRole((user.role as Role) || "user")
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editingUser) return
    setEditSaving(true)
    setEditError(null)
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName.trim() || null, role: editRole, updated_at: new Date().toISOString() })
      .eq("id", editingUser.id)
    if (error) { setEditError(error.message); setEditSaving(false); return }
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, full_name: editName.trim() || null, role: editRole } : u))
    setEditingUser(null)
    setEditSaving(false)
    showStatus("success", "User updated successfully.")
  }

  async function handleInvite() {
    setInviting(true)
    setInviteError(null)
    if (!inviteEmail.includes("@")) { setInviteError("Please enter a valid email address."); setInviting(false); return }
    const { error } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: { shouldCreateUser: true, data: { full_name: inviteName, role: inviteRole } },
    })
    if (error) { setInviteError(error.message); setInviting(false); return }
    setInviteSuccess(`Invitation sent to ${inviteEmail}. They will receive a magic link to log in.`)
    setInviteEmail("")
    setInviteName("")
    setInviting(false)
  }

  function showStatus(type: "success" | "error", text: string) {
    setStatusMessage({ type, text })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const filtered = users.filter(u => {
    const matchesRole = filterRole === "all" || u.role === filterRole
    const matchesSearch = !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase())
    return matchesRole && matchesSearch
  })

  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === "admin").length,
    manager: users.filter(u => u.role === "manager").length,
    user: users.filter(u => u.role === "user" || !u.role).length,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Add admins, managers, and users — edit their details and roles</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowInvite(true); setInviteError(null); setInviteSuccess(null) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite User
        </button>
      </div>

      {/* Status */}
      {statusMessage && (
        <div className={`mb-5 p-4 rounded-lg flex items-center gap-2 text-sm font-medium ${statusMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {statusMessage.type === "success"
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
          </svg>
          {statusMessage.text}
        </div>
      )}

      {/* Role filter + search */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(["all", "admin", "manager", "user"] as const).map(role => (
          <button
            key={role}
            type="button"
            onClick={() => setFilterRole(role)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filterRole === role ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {role === "all" ? "All Users" : role.charAt(0).toUpperCase() + role.slice(1) + "s"}
            <span className="ml-1.5 text-xs opacity-70">({counts[role]})</span>
          </button>
        ))}
        <div className="ml-auto relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No users found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Referrals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-9 h-9 object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {(user.full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.full_name || "Unnamed User"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[user.role || "user"] || "bg-gray-100 text-gray-700"}`}>
                      {user.role || "user"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.total_referrals ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.total_credits ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Edit User</h2>
              <button type="button" onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditRole(role)}
                      className={`py-2.5 rounded-lg text-sm font-medium capitalize border transition-all ${
                        editRole === role ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{ROLE_DESCRIPTIONS[editRole]}</p>
              </div>
              {editError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{editError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {editSaving ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Invite New User</h2>
              <button type="button" onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {inviteSuccess ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Invitation Sent!</p>
                <p className="text-sm text-muted-foreground">{inviteSuccess}</p>
                <button type="button" onClick={() => { setShowInvite(false); setInviteSuccess(null) }} className="mt-5 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Done</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Assign Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`py-2.5 rounded-lg text-sm font-medium capitalize border transition-all ${
                          inviteRole === role ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{ROLE_DESCRIPTIONS[inviteRole]}</p>
                </div>
                {inviteError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{inviteError}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                  <button
                    type="button"
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {inviting ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : "Send Invitation"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
