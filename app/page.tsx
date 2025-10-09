import MonadSweeperApp from "../components/MonadSweeperApp"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 py-16">
      <div className="container mx-auto px-6">
        <div className="flex justify-center">
          <MonadSweeperApp />
        </div>
      </div>
    </main>
  )
}
