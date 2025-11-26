"use client"

import type { ReactNode } from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// 🚀 1. 根据官方信息更新 Monad 主网配置
const monadChain = {
  id: 143, // <-- 已更新为官方 ChainID
  name: "Monad Mainnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
    public: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://monadscan.io" },
  },
} as const

const chains = [monadChain, mainnet, sepolia] as const

// 2. 创建 Wagmi 配置 (确保 transports 中的 ID 与 monadChain.id 匹配)
const config = createConfig({
  chains: chains,
  transports: {
    [monadChain.id]: http(), // 这里会自动使用新的 ID: 143
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

// 3. 创建 React Query 客户端
const queryClient = new QueryClient()

interface Web3ProviderProps {
  children: ReactNode
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
