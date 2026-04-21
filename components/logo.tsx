import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  linkTo?: string | null
  showIcon?: boolean
}

export function Logo({ size = "md", linkTo = "/", showIcon = true }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    xl: "w-8 h-8",
  }

  const content = (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className="bg-gradient-to-br from-primary to-warning rounded-lg p-1.5 flex items-center justify-center">
          <svg 
            className={`${iconSizes[size]} text-white`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
            />
          </svg>
        </div>
      )}
      <span className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent`}>
        Relay-it
      </span>
    </div>
  )

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex">
        {content}
      </Link>
    )
  }

  return content
}
