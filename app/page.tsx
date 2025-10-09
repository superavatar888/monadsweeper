// app/page.tsx
import MonadSweeperApp from "../components/MonadSweeperApp"

export default function Home() {
  return (
    // 增加 bg-gray-100 背景色以区分主体，并增加垂直内边距
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* 标题和描述部分居中 - 消除多余标题显示问题，并约束其宽度 */}
        <div className="text-center mb-8 w-full max-w-lg mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">MONAD 空投归集工具</h1> 
          <p className="text-lg text-gray-600">从多个空投钱包批量发送 MON 代币到交易所。</p>
        </div>
        
        {/* MonadSweeperApp 组件居中 */}
        <div className="flex justify-center">
          <MonadSweeperApp /> 
        </div>
      </div>
    </main>
  )
}
