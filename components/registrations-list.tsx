"use client"

interface Registration {
  id: string
  email: string
  name: string
  attended: boolean
  created_at: string
  referral_id: string | null
}

export function RegistrationsList({ registrations }: { registrations: Registration[] }) {
  if (registrations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Registrations</h2>
        <p className="text-muted-foreground text-sm">No registrations yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Registrations ({registrations.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Referred</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg) => (
              <tr key={reg.id} className="border-b border-border last:border-0">
                <td className="py-3 px-4 text-sm text-foreground">{reg.name}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{reg.email}</td>
                <td className="py-3 px-4">
                  {reg.referral_id ? (
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">Yes</span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">No</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reg.attended ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {reg.attended ? "Attended" : "Registered"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(reg.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
