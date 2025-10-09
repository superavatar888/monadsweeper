import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Web3Provider from "./Web3Provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Monad 空投归集工具",
  description: "从多个空投钱包批量发送 MON 代币到交易所。",
  keywords: ["Monad", "Airdrop", "Sweeper", "Batch Transfer", "EVM"],
  authors: [{ name: "Your Name" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}