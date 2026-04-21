import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Fetch workspace stats
  const [campaignsResult, contactsResult] = await Promise.all([
    supabase.from("campaigns").select("id", { count: "exact", head: true }),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
  ])

  const stats = {
    campaigns: campaignsResult.count || 0,
    contacts: contactsResult.count || 0,
    emailsSent: 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} profile={profile} stats={stats} />
      <main className="pl-60">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
