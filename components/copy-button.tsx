"use client"

import { useState } from "react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}
