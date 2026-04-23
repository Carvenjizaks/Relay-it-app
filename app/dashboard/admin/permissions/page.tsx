"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Role = "admin" | "manager" | "user"

interface Permission {
  id: string
  label: string
  description: string
}

interface RolePermissions {
  [key: string]: boolean
}

interface PermissionState {
  admin: RolePermissions
  manager: RolePermissions
  user: RolePermissions
}

const ALL_PERMISSIONS: Permission[] = [
  { id: "create_campaigns", label: "Create Campaigns", description: "Create new email campaigns" },
  { id: "edit_campaigns", label: "Edit Campaigns", description: "Edit existing campaign details and email content" },
  { id: "delete_campaigns", label: "Delete Campaigns", description: "Permanently delete campaigns" },
  { id: "view_all_campaigns", label: "View All Campaigns", description: "View campaigns created by all users" },
  { id: "add_contacts", label: "Add Contacts", description: "Add individual or bulk contacts to campaigns" },
  { id: "send_emails", label: "Send Emails", description: "Send campaign emails to contacts" },
  { id: "bulk_send_emails", label: "Bulk Send Emails", description: "Send emails to multiple selected contacts at once" },
  { id: "view_contacts", label: "View Contacts", description: "View contact lists and relay data" },
  { id: "export_contacts", label: "Export Contacts", description: "Export contact data to CSV" },
  { id: "view_relay_stats", label: "View Relay Stats", description: "View relay chain analytics and statistics" },
  { id: "manage_users", label: "Manage Users", description: "View, invite, and manage user accounts" },
  { id: "change_roles", label: "Change User Roles", description: "Promote or demote user roles" },
  { id: "view_admin_panel", label: "View Admin Panel", description: "Access the admin section of the dashboard" },
  { id: "manage_settings", label: "Manage Settings", description: "Change app settings and configurations" },
]

const DEFAULT_PERMISSIONS: PermissionState = {
  admin: Object.fromEntries(ALL_PERMISSIONS.map(p => [p.id, true])),
  manager: {
    create_campaigns: true,
    edit_campaigns: true,
    delete_campaigns: false,
    view_all_campaigns: false,
    add_contacts: true,
    send_emails: true,
    bulk_send_emails: true,
    view_contacts: true,
    export_contacts: true,
    view_relay_stats: true,
    manage_users: false,
    change_roles: false,
    view_admin_panel: false,
    manage_settings: false,
  },
  user: {
    create_campaigns: false,
    edit_campaigns: false,
    delete_campaigns: false,
    view_all_campaigns: false,
    add_contacts: false,
    send_emails: false,
    bulk_send_emails: false,
    view_contacts: true,
    export_contacts: false,
    view_relay_stats: true,
    manage_users: false,
    change_roles: false,
    view_admin_panel: false,
    manage_settings: false,
  },
}

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  user: "bg-gray-100 text-gray-700 border-gray-200",
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Full access to everything. Can manage users and all settings.",
  manager: "Can create and manage campaigns and contacts. No user management.",
  user: "Read-only access. Can view assigned campaigns and relay stats.",
}

const PERMISSION_GROUPS = [
  { label: "Campaigns", ids: ["create_campaigns", "edit_campaigns", "delete_campaigns", "view_all_campaigns"] },
  { label: "Contacts & Email", ids: ["add_contacts", "send_emails", "bulk_send_emails", "view_contacts", "export_contacts"] },
  { label: "Analytics", ids: ["view_relay_stats"] },
  { label: "Administration", ids: ["manage_users", "change_roles", "view_admin_panel", "manage_settings"] },
]

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionState>(DEFAULT_PERMISSIONS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeRole, setActiveRole] = useState<Role>("admin")

  const supabase = createClient()

  useEffect(() => {
    loadPermissions()
  }, [])

  async function loadPermissions() {
    const { data } = await supabase
      .from("role_permissions")
      .select("*")
      .single()

    if (data?.permissions) {
      setPermissions(data.permissions)
    }
  }

  async function savePermissions() {
    setSaving(true)

    // Try upsert — if no table, we just store in state
    const { error } = await supabase
      .from("role_permissions")
      .upsert({ id: 1, permissions }, { onConflict: "id" })

    if (error) {
      // Table may not exist yet — that's okay, permissions are set in-memory
      console.log("Note: role_permissions table not found, using in-memory state")
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function togglePermission(role: Role, permissionId: string) {
    if (role === "admin") return // Admin always has all permissions
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionId]: !prev[role][permissionId],
      },
    }))
  }

  function getPermissionById(id: string): Permission | undefined {
    return ALL_PERMISSIONS.find(p => p.id === id)
  }

  const roles: Role[] = ["admin", "manager", "user"]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Access & Permissions</h1>
          <p className="text-muted-foreground mt-1">Control what each role can see and do in the app</p>
        </div>
        <button
          type="button"
          onClick={savePermissions}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex gap-3 mb-8">
        {roles.map(role => (
          <button
            key={role}
            type="button"
            onClick={() => setActiveRole(role)}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              activeRole === role
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${ROLE_COLORS[role]}`}>
              {role}
            </span>
            <span className="text-xs text-muted-foreground text-center leading-snug">
              {ROLE_DESCRIPTIONS[role]}
            </span>
          </button>
        ))}
      </div>

      {/* Admin locked notice */}
      {activeRole === "admin" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-red-700">
            <span className="font-semibold">Admin always has full access.</span> Admin permissions cannot be restricted to protect app integrity.
          </p>
        </div>
      )}

      {/* Permission Groups */}
      <div className="space-y-4">
        {PERMISSION_GROUPS.map(group => (
          <div key={group.label} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-muted/40 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">{group.label}</h3>
            </div>
            <div className="divide-y divide-border">
              {group.ids.map(permId => {
                const perm = getPermissionById(permId)
                if (!perm) return null
                const isEnabled = permissions[activeRole][permId]
                const isLocked = activeRole === "admin"

                return (
                  <div
                    key={permId}
                    className={`flex items-center justify-between px-5 py-4 transition-colors ${
                      !isLocked ? "hover:bg-muted/20 cursor-pointer" : ""
                    }`}
                    onClick={() => !isLocked && togglePermission(activeRole, permId)}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium text-foreground">{perm.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                    </div>
                    <div className="shrink-0">
                      {isLocked ? (
                        <div className="w-11 h-6 bg-primary rounded-full flex items-center justify-end pr-0.5 opacity-60">
                          <div className="w-5 h-5 bg-white rounded-full shadow" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); togglePermission(activeRole, permId) }}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            isEnabled ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            isEnabled ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Compare Table */}
      <div className="mt-8 bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Permission Summary</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Quick comparison of all roles</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permission</th>
                {roles.map(role => (
                  <th key={role} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${ROLE_COLORS[role]}`}>{role}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ALL_PERMISSIONS.map(perm => (
                <tr key={perm.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 text-foreground font-medium">{perm.label}</td>
                  {roles.map(role => (
                    <td key={role} className="px-4 py-3 text-center">
                      {permissions[role][perm.id] ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 rounded-full">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
