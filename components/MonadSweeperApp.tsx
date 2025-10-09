"use client"

import { useState } from "react"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react"

// 定义地址和金额解析结果的类型
interface AccountData {
  privateKey: string
  address?: string // 仅供展示
  amount?: string // 用户指定的金额（可选）
  valid: boolean
  error?: string
}

// 帮助函数：解析私钥和金额（支持 私钥 金额 / 私钥,金额 / 私钥=金额）
const parseInputLine = (line: string): { privateKey: string; amount?: string } => {
  const separators = [",", "="]
  let parts: string[] = []
  const currentLine = line.trim()

  // 1. 尝试使用逗号或等号分割
  for (const sep of separators) {
    if (currentLine.includes(sep)) {
      parts = currentLine
        .split(sep)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
      break
    }
  }

  // 2. 如果没有特殊分隔符，尝试使用空格分割
  if (parts.length === 0) {
    parts = currentLine
      .split(/\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
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
  const [targetAddress, setTargetAddress] = useState("")
  const [rawKeyInput, setRawKeyInput] = useState("")
  const [transferMode, setTransferMode] = useState<"ALL" | "FIXED">("ALL")
  const [fixedAmount, setFixedAmount] = useState("0.05")
  const [parsedAccounts, setParsedAccounts] = useState<AccountData[]>([])
  const [status, setStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleParseKeys = () => {
    setStatus("正在解析私钥...")
    setIsSuccess(false)
    const lines = rawKeyInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
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

      results.push({
        privateKey: pk,
        address: valid ? "待查询..." : undefined,
        amount: lineAmount,
        valid,
        error,
      })
    }

    setParsedAccounts(results)
    setStatus(`已解析 ${results.length} 行，其中 ${results.filter((a) => a.valid).length} 个有效私钥。`)
  }

  const handleSweep = async () => {
    // 实际的归集逻辑 (使用 Viem)

    // 1. 校验目标地址
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
    setStatus(`开始归集 ${validAccounts.length} 个钱包，请在控制台关注交易详情...`)

    // 模拟归集循环 (替换为您的 Viem 脚本调用)
    await new Promise((resolve) => setTimeout(resolve, 5000))

    setIsProcessing(false)
    setIsSuccess(true)
    setStatus(`🎉 归集交易已发送！请检查区块链确认结果。`)
  }

  return (
    <div className="max-w-7xl w-full mx-auto p-12 bg-gradient-to-br from-white via-blue-50/40 to-purple-50/40 rounded-3xl shadow-2xl space-y-10 border-4 border-blue-200">
      <header className="text-center space-y-6 pb-8 border-b-4 border-blue-300">
        <h2 className="text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
          MONAD 空投归集工具
        </h2>
        <p className="text-2xl text-gray-700 max-w-4xl mx-auto font-semibold">
          从多个空投钱包批量发送 MON 代币到交易所。
        </p>
      </header>

      <div className="p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-l-8 border-amber-500 text-amber-900 rounded-2xl flex items-center space-x-4 shadow-xl">
        <AlertTriangle className="h-10 w-10 flex-shrink-0 text-amber-600" />
        <p className="text-lg font-bold">警告：本工具涉及私钥操作，请务必在**离线/安全环境**中使用！</p>
      </div>

      <div className="space-y-10">
        <div className="space-y-5">
          <label htmlFor="target-address" className="text-2xl font-bold text-gray-900 block">
            目标交易所地址 (归集地址):
          </label>
          <Input
            id="target-address"
            type="text"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="0x..."
            className="font-mono p-6 h-20 text-xl border-3 border-blue-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-200 rounded-2xl transition-all shadow-md"
          />
        </div>

        <div className="space-y-5">
          <label htmlFor="private-keys" className="text-2xl font-bold text-gray-900 block">
            私钥列表 (每行一个):
          </label>
          <textarea
            id="private-keys"
            value={rawKeyInput}
            onChange={(e) => setRawKeyInput(e.target.value)}
            rows={45}
            className="w-full p-8 border-3 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-600 text-lg font-mono placeholder:text-gray-400 shadow-lg bg-white transition-all resize-y"
            placeholder="格式支持：&#10; 私钥 金额 (如: 0x... 0.05) &#10; 私钥,金额 (如: 0x...,0.05) &#10; 私钥=金额 (如: 0x...=0.05) &#10; 或仅填写私钥&#10;&#10;此输入框支持输入数千个私钥，可以自由调整高度..."
          />
        </div>
      </div>

      <div className="space-y-8 border-t-4 border-blue-300 pt-10">
        <h3 className="text-3xl font-bold text-gray-900">转账模式:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Button
            variant={transferMode === "ALL" ? "default" : "outline"}
            onClick={() => setTransferMode("ALL")}
            className={`h-24 text-2xl font-bold rounded-2xl transition-all transform hover:scale-105 shadow-xl ${
              transferMode === "ALL"
                ? "bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white"
                : "border-4 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700"
            }`}
          >
            归集所有余额 (推荐)
          </Button>
          <Button
            variant={transferMode === "FIXED" ? "default" : "outline"}
            onClick={() => setTransferMode("FIXED")}
            className={`h-24 text-2xl font-bold rounded-2xl transition-all transform hover:scale-105 shadow-xl ${
              transferMode === "FIXED"
                ? "bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white"
                : "border-4 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700"
            }`}
          >
            转账固定金额或每行指定金额
          </Button>
        </div>

        {transferMode === "FIXED" && (
          <div className="pt-8 p-8 bg-blue-50 rounded-2xl border-3 border-blue-400 shadow-lg">
            <label htmlFor="fixed-amount" className="text-xl font-bold text-gray-900 block mb-4">
              统一转账金额 (MON):
            </label>
            <Input
              id="fixed-amount"
              type="text"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="0.05"
              className="font-mono h-16 text-xl border-3 rounded-xl"
            />
            <p className="text-base text-gray-700 mt-4 leading-relaxed font-medium">
              如果私钥行中未指定金额，将使用此金额。**请确保账户余额大于此金额 + Gas 费。**
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t-4 border-blue-300">
        <Button
          onClick={handleParseKeys}
          disabled={isProcessing}
          variant="outline"
          className="h-24 text-2xl font-bold rounded-2xl border-4 border-blue-600 text-blue-700 hover:bg-blue-50 hover:border-blue-700 transition-all shadow-xl bg-white transform hover:scale-105"
        >
          解析并校验私钥
        </Button>
        <Button
          onClick={handleSweep}
          disabled={isProcessing || parsedAccounts.length === 0}
          className={`h-24 text-2xl font-black rounded-2xl transition-all shadow-2xl transform hover:scale-105 ${
            isSuccess
              ? "bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:to-teal-700"
              : "bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-4 h-8 w-8 animate-spin" /> 正在处理...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="mr-4 h-8 w-8" /> 交易已发送
            </>
          ) : (
            "开始批量归集"
          )}
        </Button>
      </div>

      {status && (
        <div
          className={`p-6 rounded-2xl text-center text-lg font-bold flex items-center justify-center space-x-3 shadow-lg ${
            status.includes("错误")
              ? "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-2 border-red-400"
              : isSuccess
                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-400"
                : "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-2 border-blue-400"
          }`}
        >
          {isSuccess && <CheckCircle className="h-6 w-6" />}
          {status.includes("错误") && <AlertTriangle className="h-6 w-6" />}
          <p>{status}</p>
        </div>
      )}

      {parsedAccounts.length > 0 && (
        <div className="mt-8 p-8 border-2 border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-xl">
          <h4 className="text-2xl font-bold mb-6 text-gray-900">解析结果预览 ({parsedAccounts.length} 个钱包):</h4>
          <div className="max-h-96 overflow-y-auto rounded-xl border-2 border-gray-300 shadow-inner">
            <table className="w-full text-left text-base table-fixed">
              <thead>
                <tr className="border-b-2 bg-gradient-to-r from-gray-200 to-gray-300 sticky top-0">
                  <th className="w-16 p-4 font-bold text-gray-900">#</th>
                  <th className="w-1/3 font-bold text-gray-900">私钥 (部分)</th>
                  <th className="w-1/3 font-bold text-gray-900">转账金额</th>
                  <th className="w-1/6 font-bold text-gray-900">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {parsedAccounts.map((acc, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-blue-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-700">{index + 1}</td>
                    <td className="truncate font-mono p-4 text-sm text-gray-800">{acc.privateKey.slice(0, 10)}...</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {acc.amount || (transferMode === "ALL" ? "全部余额 - Gas" : fixedAmount)}
                    </td>
                    <td className={`p-4 font-bold ${acc.valid ? "text-green-700" : "text-red-700"}`}>
                      {acc.valid ? "✅ 有效" : `❌ ${acc.error}`}
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
