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

  // Single optimized query - get profile and counts in parallel
  const [{ data: profile }, campaignsResult, contactsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, referral_code, total_referrals, total_credits").eq("id", user.id).single(),
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
