"use client"

import { useRouter } from "next/navigation"

interface Tab {
  key: string
  label: string
  count: number
}

interface CampaignFilterTabsProps {
  tabs: Tab[]
  activeTab: string
}

export function CampaignFilterTabs({ tabs, activeTab }: CampaignFilterTabsProps) {
  const router = useRouter()

  function handleTabClick(key: string) {
    const params = new URLSearchParams()
    if (key !== "all") params.set("tab", key)
    const query = params.toString()
    router.push(`/dashboard/campaigns${query ? `?${query}` : ""}`)
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                isActive ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
