import MonadSweeperApp from "../components/MonadSweeperApp"

export default function Home() {
  return (
    // 使用 bg-gray-100 作为整体背景色，提供视觉对比度
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* ---------------------------------------------------- */}
        {/* 移除外部标题结构，防止与 MonadSweeperApp 内部的标题重复 */}
        {/* ---------------------------------------------------- */}
        
        {/* MonadSweeperApp 组件居中 */}
        <div className="flex justify-center">
          {/* MonadSweeperApp 内部已经包含了标题、卡片背景、阴影和所有逻辑 */}
          <MonadSweeperApp /> 
        </div>
      </div>
    </main>
  )
}
