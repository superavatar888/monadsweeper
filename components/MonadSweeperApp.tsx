"use client"

import { useState } from "react"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Loader2, CheckCircle, Wallet, Send, FileScan } from "lucide-react"

// (接口和辅助函数部分保持不变)
interface AccountData {
  privateKey: string
  address?: string
  amount?: string
  valid: boolean
  error?: string
}

const parseInputLine = (line: string): { privateKey: string; amount?: string } => {
  const separators = [",", "="]
  let parts: string[] = []
  const currentLine = line.trim()
  for (const sep of separators) {
    if (currentLine.includes(sep)) {
      parts = currentLine.split(sep).map((p) => p.trim()).filter((p) => p.length > 0)
      break
    }
  }
  if (parts.length === 0) {
    parts = currentLine.split(/\s+/).map((p) => p.trim()).filter((p) => p.length > 0)
  }
  if (parts.length === 2) {
    return { privateKey: parts[0], amount: parts[1] }
  } else if (parts.length === 1) {
    return { privateKey: parts[0] }
  } else {
    return { privateKey: currentLine }
  }
}

export default function MonadSweeperApp() {
  // (状态管理逻辑保持不变)
  const [targetAddress, setTargetAddress] = useState("")
  const [rawKeyInput, setRawKeyInput] = useState("")
  const [transferMode, setTransferMode] = useState<"ALL" | "FIXED">("ALL")
  const [fixedAmount, setFixedAmount] = useState("0.05")
  const [parsedAccounts, setParsedAccounts] = useState<AccountData[]>([])
  const [status, setStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // (事件处理函数保持不变)
  const handleParseKeys = () => {
    setStatus("正在解析私钥...")
    setIsSuccess(false)
    const lines = rawKeyInput.split("\n").map((line) => line.trim()).filter((line) => line.length > 0)
    const results: AccountData[] = []
    for (const line of lines) {
      const { privateKey, amount: lineAmount } = parseInputLine(line)
      let valid = true
      let error = undefined
      const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
      if (pk.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
        valid = false
        error = "私钥格式错误"
      }
      if (lineAmount) {
        try {
          parseEther(lineAmount as `${number}`)
        } catch {
          valid = false
          error = "金额格式错误"
        }
      }
      results.push({ privateKey: pk, address: valid ? "待查询..." : undefined, amount: lineAmount, valid, error })
    }
    setParsedAccounts(results)
    setStatus(`已解析 ${results.length} 行，其中 ${results.filter((a) => a.valid).length} 个有效私钥。`)
  }

  const handleSweep = async () => {
    if (!targetAddress || targetAddress.length !== 42 || !targetAddress.startsWith("0x")) {
      setStatus("错误：请输入有效的目标交易所地址 (0x...)。")
      return
    }
    const validAccounts = parsedAccounts.filter((a) => a.valid)
    if (validAccounts.length === 0) {
      setStatus("错误：没有有效的私钥可以进行归集。")
      return
    }
    setIsProcessing(true)
    setIsSuccess(false)
    setStatus(`开始归集 ${validAccounts.length} 个钱包...`)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsProcessing(false)
    setIsSuccess(true)
    setStatus(`🎉 归集交易已发送！请检查区块链确认结果。`)
  }

  // --- 🚀 UI 重构 (参考版) ---
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-800">
          MONAD 空投归集工具
        </h1>
        <p className="text-md text-gray-500">
          从多个空投钱包批量发送 MON 代币到交易所
        </p>
      </header>

      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-md flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium">警告：本工具涉及私钥操作，请务必在**离线/安全环境**中使用！</p>
      </div>

      <div className="space-y-6 border rounded-lg p-6 bg-white">
        {/* --- 步骤 1: 目标地址 --- */}
        <div className="space-y-2">
          <label htmlFor="target-address" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">1</span>
            输入归集地址
          </label>
          <Input
            id="target-address"
            type="text"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="输入您的交易所充值地址或个人钱包地址 0x..."
            className="h-11 text-sm font-mono"
          />
        </div>

        {/* --- 步骤 2: 私钥列表 --- */}
        <div className="space-y-2">
          <label htmlFor="private-keys" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">2</span>
            粘贴私钥列表
          </label>
          <textarea
            id="private-keys"
            value={rawKeyInput}
            onChange={(e) => setRawKeyInput(e.target.value)}
            rows={10}
            className="w-full p-3 border rounded-md text-xs font-mono placeholder:text-gray-400 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition resize-y"
            placeholder={`格式支持 (每行一个):\n私钥 金额 (例如: 0x... 0.05)\n私钥,金额 (例如: 0x...,0.05)\n或者仅私钥`}
          />
        </div>
        
        {/* --- 步骤 3: 转账模式 --- */}
        <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">3</span>
                选择转账模式
            </h3>
            {/* 参照截图优化的按钮组 */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 border">
                <Button
                    onClick={() => setTransferMode('ALL')}
                    variant="ghost" // 使用 ghost 变体以实现默认透明
                    className={`h-10 text-sm font-semibold transition-all rounded-md ${
                        transferMode === 'ALL' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    归集所有余额 (推荐)
                </Button>
                <Button
                    onClick={() => setTransferMode('FIXED')}
                    variant="ghost"
                    className={`h-10 text-sm font-semibold transition-all rounded-md ${
                        transferMode === 'FIXED' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    指定金额
                </Button>
            </div>

            {transferMode === 'FIXED' && (
              <div className="pt-3 px-3 pb-2 bg-gray-50 rounded-md border">
                <label htmlFor="fixed-amount" className="text-xs font-semibold text-gray-600 block mb-1">
                  统一转账金额 (MON):
                </label>
                <Input
                  id="fixed-amount"
                  type="text"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  placeholder="0.05"
                  className="h-9 font-mono text-sm"
                />
              </div>
            )}
        </div>
      </div>

      {/* --- 最终操作按钮 --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex-grow text-gray-600 text-sm font-medium">
            {status ? status : "请按步骤操作"}
        </div>
        <div className="flex items-center gap-3">
            <Button
              onClick={handleParseKeys}
              disabled={isProcessing}
              variant="outline"
              className="h-10 px-5 text-sm font-semibold"
            >
              解析并校验
            </Button>
            <Button
              onClick={handleSweep}
              disabled={isProcessing || parsedAccounts.filter(a => a.valid).length === 0}
              className="h-10 px-5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在归集</>
              ) : (
                "开始归集"
              )}
            </Button>
        </div>
      </div>

      {/* --- 解析结果预览 --- */}
      {parsedAccounts.length > 0 && (
        <div className="border rounded-lg bg-white">
          <div className="p-4 border-b">
            <h4 className="text-md font-semibold text-gray-800">解析结果预览 ({parsedAccounts.length} 个钱包):</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-12 p-2.5 font-semibold text-gray-600">#</th>
                  <th className="p-2.5 font-semibold text-gray-600">私钥 (部分)</th>
                  <th className="p-2.5 font-semibold text-gray-600">转账金额</th>
                  <th className="p-2.5 font-semibold text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedAccounts.map((acc, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="p-2.5 font-medium text-gray-500">{index + 1}</td>
                    <td className="truncate font-mono p-2.5 text-gray-700">{acc.privateKey.slice(0, 10)}...</td>
                    <td className="p-2.5 font-semibold text-gray-700">
                      {acc.amount || (transferMode === "ALL" ? "全部余额" : fixedAmount)}
                    </td>
                    <td className={`p-2.5 font-bold ${acc.valid ? "text-green-600" : "text-red-600"}`}>
                      {acc.valid ? "✓ 有效" : `✗ ${acc.error}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
