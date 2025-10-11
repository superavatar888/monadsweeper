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

  // --- 🚀 UI 重构开始 ---
  return (
    <div className="w-full max-w-5xl mx-auto p-8 space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          MONAD 空投归集工具
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          从多个空投钱包批量发送 MON 代币到交易所。
        </p>
      </header>

      <div className="p-4 bg-amber-100/50 border-l-4 border-amber-500 text-amber-900 rounded-lg flex items-center gap-4">
        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-600" />
        <p className="text-base font-semibold">警告：本工具涉及私钥操作，请务必在**离线/安全环境**中使用！</p>
      </div>

      <div className="space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border">
        {/* --- 步骤 1: 目标地址 --- */}
        <div className="space-y-3">
          <label htmlFor="target-address" className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            第一步：输入归集地址
          </label>
          <Input
            id="target-address"
            type="text"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="输入您的交易所充值地址或个人钱包地址 0x..."
            className="h-14 text-base font-mono rounded-lg"
          />
        </div>

        {/* --- 步骤 2: 私钥列表 --- */}
        <div className="space-y-3">
          <label htmlFor="private-keys" className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileScan className="h-5 w-5 text-blue-600" />
            第二步：粘贴私钥列表
          </label>
          <textarea
            id="private-keys"
            value={rawKeyInput}
            onChange={(e) => setRawKeyInput(e.target.value)}
            rows={15} // 调整了默认行数，但保留可调整高度
            className="w-full p-4 border rounded-lg text-sm font-mono placeholder:text-gray-400 shadow-inner bg-gray-50/50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition resize-y"
            placeholder={`格式支持 (每行一个):\n私钥 金额 (例如: 0x... 0.05)\n私钥,金额 (例如: 0x...,0.05)\n或者仅私钥`}
          />
        </div>
        
        {/* --- 步骤 3: 转账模式 --- */}
        <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                第三步：选择转账模式
            </h3>
            {/* 优化后的按钮组，不再拉伸 */}
            <div className="p-1 rounded-full bg-gray-200/70 max-w-md mx-auto">
                <div className="flex items-center gap-1">
                    <Button
                        variant={transferMode === 'ALL' ? 'default' : 'outline'}
                        onClick={() => setTransferMode('ALL')}
                        className={`w-1/2 rounded-full text-base font-bold transition-all h-12 ${transferMode === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent border-0 text-gray-600 hover:bg-white'}`}
                    >
                        归集所有余额 (推荐)
                    </Button>
                    <Button
                        variant={transferMode === 'FIXED' ? 'default' : 'outline'}
                        onClick={() => setTransferMode('FIXED')}
                        className={`w-1/2 rounded-full text-base font-bold transition-all h-12 ${transferMode === 'FIXED' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent border-0 text-gray-600 hover:bg-white'}`}
                    >
                        指定金额
                    </Button>
                </div>
            </div>

            {transferMode === 'FIXED' && (
              <div className="pt-4 px-4 pb-2 bg-blue-50/70 rounded-lg border border-blue-200">
                <label htmlFor="fixed-amount" className="text-sm font-bold text-gray-800 block mb-2">
                  统一转账金额 (MON):
                </label>
                <Input
                  id="fixed-amount"
                  type="text"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  placeholder="0.05"
                  className="font-mono h-12"
                />
                <p className="text-xs text-gray-600 mt-2">
                  如果私钥行中未指定金额，将使用此金额。
                </p>
              </div>
            )}
        </div>
      </div>

      {/* --- 最终操作按钮 --- */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 p-6 bg-gray-100/80 rounded-2xl border">
        {status && (
            <div className={`flex-grow text-center sm:text-left text-sm font-semibold p-2 rounded-md ${
                status.includes("错误") ? "text-red-700" : isSuccess ? "text-green-700" : "text-blue-700"
            }`}>
                {status}
            </div>
        )}
        <div className="flex items-center gap-4">
            <Button
              onClick={handleParseKeys}
              disabled={isProcessing}
              variant="outline"
              className="h-14 px-6 text-base font-bold rounded-lg border-2"
            >
              解析并校验
            </Button>
            <Button
              onClick={handleSweep}
              disabled={isProcessing || parsedAccounts.filter(a => a.valid).length === 0}
              className={`h-14 px-8 text-base font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 ${
                isSuccess
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  : "bg-gradient-to-r from-blue-600 to-purple-700 text-white"
              }`}
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> 正在归集...</>
              ) : isSuccess ? (
                <><CheckCircle className="mr-2 h-5 w-5" /> 完成</>
              ) : (
                "开始归集"
              )}
            </Button>
        </div>
      </div>

      {/* --- 解析结果预览 --- */}
      {parsedAccounts.length > 0 && (
        <div className="mt-4 p-6 border rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
          <h4 className="text-lg font-bold mb-4 text-gray-900">解析结果预览 ({parsedAccounts.length} 个钱包):</h4>
          <div className="max-h-80 overflow-y-auto rounded-lg border shadow-inner">
            <table className="w-full text-left text-sm table-fixed">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="border-b">
                  <th className="w-16 p-3 font-semibold text-gray-700">#</th>
                  <th className="w-1/3 p-3 font-semibold text-gray-700">私钥 (部分)</th>
                  <th className="w-1/3 p-3 font-semibold text-gray-700">转账金额</th>
                  <th className="w-1/6 p-3 font-semibold text-gray-700">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {parsedAccounts.map((acc, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-blue-50/50 transition-colors">
                    <td className="p-3 font-medium text-gray-600">{index + 1}</td>
                    <td className="truncate font-mono p-3 text-gray-800">{acc.privateKey.slice(0, 10)}...</td>
                    <td className="p-3 font-semibold text-gray-800">
                      {acc.amount || (transferMode === "ALL" ? "全部余额" : fixedAmount)}
                    </td>
                    <td className={`p-3 font-bold ${acc.valid ? "text-green-600" : "text-red-600"}`}>
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
