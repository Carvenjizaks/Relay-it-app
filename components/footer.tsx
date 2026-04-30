import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold">Relay</span>
            </div>
            <p className="text-sm text-background/70 max-w-xs leading-relaxed">
              Turn every attendee into an ambassador. Grow your events through viral referrals and trusted word-of-mouth.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link href="#features" className="hover:text-background transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-background transition-colors">How It Works</Link></li>
              <li><Link href="#pricing" className="hover:text-background transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link href="#" className="hover:text-background transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-background transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-background transition-colors">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li>
                <a href="mailto:support@nexiumbi.com" className="hover:text-background transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@nexiumbi.com
                </a>
              </li>
              <li><Link href="#" className="hover:text-background transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-background transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/60">
            © 2026 Relay. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-background/60">
            <Link href="#" className="hover:text-background transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-background transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
