export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Relay App</h1>
        <p className="text-lg text-gray-600 mb-8">Event lead generation through creditable referrals</p>
        <a 
          href="/dashboard" 
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
