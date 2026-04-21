export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Relay-it
        </h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8">
          Event lead generation through creditable referrals
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90 transition-opacity">
            Get Started
          </button>
          <button className="px-6 py-3 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}
