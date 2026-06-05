export default function EmployerLayout({
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
