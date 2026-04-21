"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  full_name: string | null
  email: string
  role: "admin" | "manager" | "user"
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    // Get profiles with their auth email
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profiles) {
      // Get auth users to get emails
      const usersWithEmail = await Promise.all(
        profiles.map(async (profile) => {
          // For now, we'll use the profile data
          // In production, you'd want to store email in profiles
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email || `user-${profile.id.slice(0, 8)}@example.com`,
            role: profile.role || "user",
            created_at: profile.created_at,
          }
        })
      )
      setUsers(usersWithEmail)
    }
    setLoading(false)
  }

  async function updateRole(userId: string, newRole: "admin" | "manager" | "user") {
    setUpdating(userId)

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)

    if (!error) {
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      )
    }

    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">
                      {user.full_name || "No name"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-700"
                      : user.role === "manager"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value as "admin" | "manager" | "user")}
                    disabled={updating === user.id}
                    className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No users found
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="mt-8 bg-muted/30 rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">admin</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Full access to all features</li>
              <li>Manage user roles</li>
              <li>View all campaigns & contacts</li>
              <li>Create and edit campaigns</li>
            </ul>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">manager</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Create and edit own campaigns</li>
              <li>View own campaign contacts</li>
              <li>Send emails to contacts</li>
              <li>Cannot manage users</li>
            </ul>
          </div>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">user</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>View assigned campaigns</li>
              <li>Relay messages only</li>
              <li>Cannot create campaigns</li>
              <li>Limited dashboard access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
