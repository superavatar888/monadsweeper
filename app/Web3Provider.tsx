"use client"

import React, { ReactNode } from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// 1. 定义 Monad 占位符链配置 (主网上线后需替换此配置)
const monadChain = {
  id: 77777, // Monad 假设 Chain ID
  name: 'Monad Mainnet (Placeholder)',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] }, // 需替换为 Monad 真实主网 RPC
    public: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monadscan', url: 'https://monadscan.io' }, // 需替换为真实区块浏览器
  },
} as const;

const chains = [monadChain, mainnet, sepolia] as const

// 2. 创建 Wagmi 配置
const config = createConfig({
  chains: chains,
  transports: {
    [monadChain.id]: http(),
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
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}