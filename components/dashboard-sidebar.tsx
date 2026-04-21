"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  referral_code: string
  total_referrals: number
  total_credits: number
  role?: "admin" | "manager" | "user"
}

interface Stats {
  campaigns: number
  contacts: number
  emailsSent: number
}

export function DashboardSidebar({ 
  user, 
  profile,
  stats 
}: { 
  user: User
  profile: Profile | null
  stats: Stats
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isAdmin = profile?.role === "admin"
  const isManager = profile?.role === "manager" || isAdmin

  const navItems = [
    { 
      href: "/dashboard", 
      label: "Home", 
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      exact: true
    },
    { 
      href: "/dashboard/campaigns", 
      label: "Campaigns", 
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    },
    { 
      href: "/dashboard/contacts", 
      label: "Contacts", 
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    },
    { 
      href: "/dashboard/referrals", 
      label: "Relay Stats", 
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    },
  ]

  const adminItems = isAdmin ? [
    { 
      href: "/dashboard/admin", 
      label: "Admin", 
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    },
    { 
      href: "/dashboard/admin/users", 
      label: "Users", 
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    },
    { 
      href: "/dashboard/admin/contacts", 
      label: "All Contacts", 
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    },
  ] : []

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar text-sidebar-foreground flex flex-col z-50">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white">relay-it</span>
        </Link>
      </div>

      {/* Create New Button */}
      {isManager && (
        <div className="p-3">
          <Link
            href="/dashboard/campaigns/new"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-sidebar-primary hover:bg-sidebar-primary/90 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create new
          </Link>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          )
        })}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Admin
              </span>
            </div>
            {adminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              )
            })}
          </>
        )}

        <div className="pt-4 pb-2">
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Support
          </span>
        </div>
        <a
          href="mailto:support@relay-it.app"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Support
        </a>
      </nav>

      {/* Usage Stats */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs font-semibold text-sidebar-foreground/50 mb-3">
          Workspace usage
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-sidebar-foreground/70">Campaigns</span>
              <span className="text-white font-medium">{stats.campaigns} / 50</span>
            </div>
            <div className="h-1.5 bg-sidebar-accent/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sidebar-primary rounded-full transition-all"
                style={{ width: `${Math.min((stats.campaigns / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-sidebar-foreground/70">Contacts</span>
              <span className="text-white font-medium">{stats.contacts} / 10,000</span>
            </div>
            <div className="h-1.5 bg-sidebar-accent/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-info rounded-full transition-all"
                style={{ width: `${Math.min((stats.contacts / 10000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-sidebar-foreground/50 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Resets monthly
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer group">
          <div className="w-8 h-8 bg-sidebar-accent rounded-lg flex items-center justify-center text-sm font-semibold text-white">
            {(profile?.full_name || user.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {profile?.full_name || user.email?.split("@")[0]}
            </div>
            <div className="text-xs text-sidebar-foreground/50 truncate">
              {user.email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-sidebar-foreground/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            title="Sign Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
