import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">Relay</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-sm text-accent-foreground">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                Now in public beta
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Grow your events through{" "}
                <span className="text-primary">viral referrals</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Turn every attendee into an ambassador. Relay empowers your contacts to share your events with their network, creating exponential growth through trusted word-of-mouth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Get started free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
                  View demo
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Campaign Performance</p>
                    <p className="text-2xl font-bold text-foreground">Tech Summit 2026</p>
                  </div>
                  <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
                    +312%
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Total Contacts</p>
                        <p className="text-sm text-muted-foreground">Direct + Relayed</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">2,847</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Relay Rate</p>
                        <p className="text-sm text-muted-foreground">Contacts who shared</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-success">43%</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Emails Sent</p>
                        <p className="text-sm text-muted-foreground">Delivered successfully</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">4,521</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-foreground">300%</p>
              <p className="text-sm text-muted-foreground mt-1">average reach increase</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-foreground">45%</p>
              <p className="text-sm text-muted-foreground mt-1">relay conversion rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-foreground">10K+</p>
              <p className="text-sm text-muted-foreground mt-1">events powered</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-foreground">2M+</p>
              <p className="text-sm text-muted-foreground mt-1">contacts reached</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
              Everything you need to grow your events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools to create, manage, and amplify your event campaigns through trusted referrals.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Smart Email Campaigns</h3>
              <p className="text-muted-foreground">
                Create beautiful email campaigns with personalized relay links. Track opens, clicks, and conversions in real-time.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Viral Relay System</h3>
              <p className="text-muted-foreground">
                Empower your contacts to share with their network. Each share generates a unique tracking link for attribution.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground">
                Track relay depth, conversion rates, and top referrers. Understand exactly how your event spreads.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Contact Management</h3>
              <p className="text-muted-foreground">
                Import and organize your contacts into lists. Segment by engagement, relay activity, and more.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Compliant</h3>
              <p className="text-muted-foreground">
                GDPR compliant with built-in unsubscribe handling. Your data is encrypted and protected.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Instant Setup</h3>
              <p className="text-muted-foreground">
                Get started in minutes. No technical knowledge required. Just create, send, and watch it grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
              How Relay works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to exponential event growth.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Create Campaign</h3>
              <p className="text-muted-foreground">
                Set up your event details, craft your email message, and import your initial contact list.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Send & Relay</h3>
              <p className="text-muted-foreground">
                Your contacts receive personalized emails with unique relay links to share with their network.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Track & Grow</h3>
              <p className="text-muted-foreground">
                Watch your event spread virally. Track every referral, see relay depth, and measure ROI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Ready to grow your next event?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers using Relay to amplify their reach through trusted referrals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
              Start for free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold border border-border text-foreground rounded-xl hover:bg-muted transition-colors">
              See it in action
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required. Free forever for small events.
          </p>
        </div>
      </section>
    </div>
  )
}
