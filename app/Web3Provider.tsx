"use client";

import React, { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🚀 Monad 测试网配置
const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Testnet Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
} as const;

// 🎯 Monad 主网配置（待官方上线后启用）
const monadMainnet = {
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
    public: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://monadscan.io" },
  },
} as const;

// 配置支持的链（测试网和主网）
const chains = [monadTestnet, monadMainnet] as const;

// 创建 Wagmi 配置
const config = createConfig({
  chains: chains,
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
    [monadMainnet.id]: http("https://rpc.monad.xyz"),
  },
});

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

// 导出链配置供其他组件使用
export { monadTestnet, monadMainnet };
