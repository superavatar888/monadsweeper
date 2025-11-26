"use client"

import type { ReactNode } from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const monadChain = {
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc3.monad.xyz"] },
    public: { http: ["https://rpc3.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://monadscan.io" },
  },
} as const

const chains = [monadChain] as const

const config = createConfig({
  chains: chains,
  transports: {
    [monadChain.id]: http("https://rpc3.monad.xyz"),
  },
})

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
