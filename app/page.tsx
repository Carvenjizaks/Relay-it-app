export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🔗 Relay App</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Event lead generation through creditable referrals
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🚀 Getting Started</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="bg-primary-100 text-primary-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
              <span>Copy <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.example</code> to <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.local</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary-100 text-primary-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
              <span>Add your Supabase credentials</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary-100 text-primary-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
              <span>Run the SQL schema in Supabase Dashboard → SQL Editor</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary-100 text-primary-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">4</span>
              <span>Start the dev server: <code className="bg-gray-100 px-2 py-1 rounded text-sm">npm run dev</code></span>
            </li>
          </ol>
        </div>

        {/* API Endpoints */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">📊 API Endpoints</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Tenants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🏢 Tenants</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/tenants</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/tenants</code></li>
              </ul>
            </div>

            {/* Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">👥 Users</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/users</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/users</code></li>
              </ul>
            </div>

            {/* Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📅 Events</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/events</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/events</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/events/:id/analytics</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/events/:id/leaderboard</code></li>
              </ul>
            </div>

            {/* Referral Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🔗 Referral Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/referral-links</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/referral-links</code></li>
              </ul>
            </div>

            {/* Registrations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📝 Registrations</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/registrations</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/registrations</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/register</code></li>
              </ul>
            </div>

            {/* Credits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">💰 Credits</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/credits</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/credits/:userId</code></li>
              </ul>
            </div>

            {/* Perks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🎁 Perks</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/perks</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/perks</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/perks/claim</code></li>
              </ul>
            </div>

            {/* Link Clicks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Link Analytics</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/link-clicks</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/link-clicks</code></li>
              </ul>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📧 Email</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/email</code></li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/email</code></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Database Tables */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">💾 Database Tables</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'tenants', desc: 'Multi-tenant organizations' },
              { name: 'users', desc: 'People across all tenants' },
              { name: 'events', desc: 'Events with referral config' },
              { name: 'referral_links', desc: 'Trackable referral codes' },
              { name: 'registrations', desc: 'Event sign-ups' },
              { name: 'referral_chain', desc: 'Multi-level tracking' },
              { name: 'credits', desc: 'Points/reward system' },
              { name: 'perks', desc: 'Redeemable rewards' },
              { name: 'perk_claims', desc: 'User redemptions' },
              { name: 'link_clicks', desc: 'Click analytics' },
            ].map((table) => (
              <div key={table.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <strong className="text-gray-900">{table.name}</strong>
                <p className="text-sm text-gray-600 mt-1">{table.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-semibold mb-4">✨ Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Multi-tenant SaaS architecture',
              'Auto-generated referral codes (nanoid)',
              'Credit system with auto-awards',
              'Multi-level referral chain tracking',
              'Full event lifecycle management',
              'Leaderboard & gamification',
              'Analytics & conversion rates',
              'Perk redemption system',
              'Detailed click tracking (device, geo)',
              'Fraud protection (IP hashing, limits)',
              'SMTP.com email integration',
              'Automated email notifications',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Built with Next.js 15 + TypeScript + Tailwind CSS + Supabase + SMTP.com</p>
          <p className="mt-2">© NexiumDigital</p>
        </div>
      </div>
    </main>
  );
}
