import MonadSweeperApp from "../components/MonadSweeperApp";

export default function Home() {
  return (
    // 🚀 FIX: 将背景更新为浅灰色，以匹配 Dashboard 风格
    <main className="min-h-screen bg-gray-100 font-sans">
      <MonadSweeperApp />
    </main>
  );
}
