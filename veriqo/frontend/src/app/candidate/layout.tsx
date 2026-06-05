export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
