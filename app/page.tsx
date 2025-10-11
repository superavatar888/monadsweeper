import MonadSweeperApp from "../components/MonadSweeperApp";

export default function Home() {
  return (
    // 为主卡片提供一个浅灰色背景和垂直间距
    <main className="min-h-screen bg-gray-100 font-sans py-12 px-4">
      <MonadSweeperApp />
    </main>
  );
}
