import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground">Admin</span>
        </div>
        <nav className="flex gap-1 border-b border-border">
          <Link
            href="/dashboard/admin"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/admin/users"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Users
          </Link>
          <Link
            href="/dashboard/admin/contacts"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            All Contacts
          </Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
