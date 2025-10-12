"use client"

import { useState } from "react"
import { parseEther, createWalletClient, http, formatEther, type Address } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Loader2, ArrowRight, Download } from "lucide-react"

interface AccountData {
  privateKey: string
  address?: string
  amount?: string
  valid: boolean
  error?: string
}

interface TargetMapping {
  sourceIndex: number
  targetAddress: string
  amount: string
}

interface TransactionResult {
  sourceAddress: string
  targetAddress: string
  amount: string
  txHash: string
  status: 'success' | 'failed'
  error?: string
  explorerUrl: string
}

// Monad 测试网配置
const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
}

// 未来主网配置（待官方发布后启用）
const monadMainnet = {
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://monadscan.io" },
  },
}

const parseInputLine = (line: string): { privateKey: string; amount?: string } => {
  const separators = [",", "="]
  let parts: string[] = []
  const currentLine = line.trim()
  for (const sep of separators) {
    if (currentLine.includes(sep)) {
      parts = currentLine
        .split(sep)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
      break
    }
  }
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

// 导出为 Excel (CSV 格式)
const exportToExcel = (results: TransactionResult[]) => {
  const headers = ["源地址", "目标地址", "转账金额 (MON)", "交易哈希", "状态", "错误信息", "区块浏览器链接"]
  const rows = results.map(r => [
    r.sourceAddress,
    r.targetAddress,
    r.amount,
    r.txHash,
    r.status === 'success' ? '成功' : '失败',
    r.error || '',
    r.explorerUrl
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `monad_transfer_${Date.now()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function MonadSweeperApp() {
  const [useTestnet, setUseTestnet] = useState(true) // 切换测试网/主网
  const [collectionMode, setCollectionMode] = useState<"MANY_TO_ONE" | "MANY_TO_MANY">("MANY_TO_ONE")
  const [targetAddress, setTargetAddress] = useState("")
  const [targetAddresses, setTargetAddresses] = useState("")
  const [parsedTargets, setParsedTargets] = useState<string[]>([])
  const [rawKeyInput, setRawKeyInput] = useState("")
  const [transferMode, setTransferMode] = useState<"ALL" | "FIXED">("ALL")
  const [fixedAmount, setFixedAmount] = useState("0.05")
  const [parsedAccounts, setParsedAccounts] = useState<AccountData[]>([])
  const [transferMappings, setTransferMappings] = useState<TargetMapping[]>([])
  const [status, setStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([])

  const currentChain = useTestnet ? monadTestnet : monadMainnet

  const handleParseTargets = () => {
    if (collectionMode === "MANY_TO_MANY") {
      const lines = targetAddresses
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line.startsWith("0x") && line.length === 42)
      setParsedTargets(lines)
      setStatus(`已解析 ${lines.length} 个目标地址`)
    }
  }

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
      let address = undefined
      
      const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
      
      if (pk.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
        valid = false
        error = "私钥格式错误"
      } else {
        try {
          const account = privateKeyToAccount(pk as `0x${string}`)
          address = account.address
        } catch (e) {
          valid = false
          error = "私钥无效"
        }
      }
      
      if (lineAmount) {
        try {
          parseEther(lineAmount as `${number}`)
        } catch {
          valid = false
          error = "金额格式错误"
        }
      }
      
      results.push({ privateKey: pk, address, amount: lineAmount, valid, error })
    }
    
    setParsedAccounts(results)
    
    if (collectionMode === "MANY_TO_MANY" && parsedTargets.length > 0) {
      const validAccounts = results.filter(a => a.valid)
      const mappings: TargetMapping[] = []
      
      for (let i = 0; i < validAccounts.length; i++) {
        const targetIndex = i % parsedTargets.length
        mappings.push({
          sourceIndex: i,
          targetAddress: parsedTargets[targetIndex],
          amount: validAccounts[i].amount || (transferMode === "FIXED" ? fixedAmount : "全部")
        })
      }
      setTransferMappings(mappings)
      setStatus(`已解析 ${results.length} 行，其中 ${validAccounts.length} 个有效。已创建 ${mappings.length} 个转账映射。`)
    } else {
      setStatus(`已解析 ${results.length} 行，其中 ${results.filter((a) => a.valid).length} 个有效。`)
    }
  }

  const handleSweep = async () => {
    if (collectionMode === "MANY_TO_ONE") {
      if (!targetAddress || targetAddress.length !== 42 || !targetAddress.startsWith("0x")) {
        setStatus("错误：请输入有效的目标地址。")
        return
      }
    } else {
      if (parsedTargets.length === 0) {
        setStatus("错误：请先解析目标地址列表。")
        return
      }
      if (transferMappings.length === 0) {
        setStatus("错误：没有有效的转账映射关系。")
        return
      }
    }
    
    const validAccounts = parsedAccounts.filter((a) => a.valid)
    if (validAccounts.length === 0) {
      setStatus("错误：没有有效的私钥可以归集。")
      return
    }
    
    setIsProcessing(true)
    setIsSuccess(false)
    setTransactionResults([])
    
    const results: TransactionResult[] = []
    
    try {
      if (collectionMode === "MANY_TO_ONE") {
        setStatus(`正在归集 ${validAccounts.length} 个钱包到单一地址...`)
        
        for (let i = 0; i < validAccounts.length; i++) {
          const account = validAccounts[i]
          setStatus(`正在处理钱包 ${i + 1}/${validAccounts.length}...`)
          
          try {
            const walletAccount = privateKeyToAccount(account.privateKey as `0x${string}`)
            const walletClient = createWalletClient({
              account: walletAccount,
              chain: currentChain,
              transport: http()
            })
            
            // 获取余额
            const balance = await walletClient.getBalance({ address: walletAccount.address })
            
            let transferAmount: bigint
            if (transferMode === "FIXED") {
              transferAmount = parseEther(account.amount || fixedAmount)
            } else {
              // 预估 gas 费用 (21000 gas * gas price)
              const gasPrice = await walletClient.getGasPrice()
              const estimatedGas = 21000n
              const gasCost = gasPrice * estimatedGas
              transferAmount = balance > gasCost ? balance - gasCost : 0n
            }
            
            if (transferAmount <= 0n) {
              results.push({
                sourceAddress: walletAccount.address,
                targetAddress: targetAddress,
                amount: '0',
                txHash: 'N/A',
                status: 'failed',
                error: '余额不足',
                explorerUrl: 'N/A'
              })
              continue
            }
            
            // 发送交易
            const hash = await walletClient.sendTransaction({
              to: targetAddress as Address,
              value: transferAmount,
            })
            
            results.push({
              sourceAddress: walletAccount.address,
              targetAddress: targetAddress,
              amount: formatEther(transferAmount),
              txHash: hash,
              status: 'success',
              explorerUrl: `${currentChain.blockExplorers.default.url}/tx/${hash}`
            })
            
          } catch (error: any) {
            results.push({
              sourceAddress: account.address || 'Unknown',
              targetAddress: targetAddress,
              amount: '0',
              txHash: 'N/A',
              status: 'failed',
              error: error.message || '交易失败',
              explorerUrl: 'N/A'
            })
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } else {
        setStatus(`正在执行 ${transferMappings.length} 笔一对一转账...`)
        
        for (let i = 0; i < transferMappings.length; i++) {
          const mapping = transferMappings[i]
          const account = validAccounts[mapping.sourceIndex]
          setStatus(`正在处理转账 ${i + 1}/${transferMappings.length}...`)
          
          try {
            const walletAccount = privateKeyToAccount(account.privateKey as `0x${string}`)
            const walletClient = createWalletClient({
              account: walletAccount,
              chain: currentChain,
              transport: http()
            })
            
            const balance = await walletClient.getBalance({ address: walletAccount.address })
            
            let transferAmount: bigint
            if (transferMode === "FIXED") {
              transferAmount = parseEther(account.amount || fixedAmount)
            } else {
              const gasPrice = await walletClient.getGasPrice()
              const estimatedGas = 21000n
              const gasCost = gasPrice * estimatedGas
              transferAmount = balance > gasCost ? balance - gasCost : 0n
            }
            
            if (transferAmount <= 0n) {
              results.push({
                sourceAddress: walletAccount.address,
                targetAddress: mapping.targetAddress,
                amount: '0',
                txHash: 'N/A',
                status: 'failed',
                error: '余额不足',
                explorerUrl: 'N/A'
              })
              continue
            }
            
            const hash = await walletClient.sendTransaction({
              to: mapping.targetAddress as Address,
              value: transferAmount,
            })
            
            results.push({
              sourceAddress: walletAccount.address,
              targetAddress: mapping.targetAddress,
              amount: formatEther(transferAmount),
              txHash: hash,
              status: 'success',
              explorerUrl: `${currentChain.blockExplorers.default.url}/tx/${hash}`
            })
            
          } catch (error: any) {
            results.push({
              sourceAddress: account.address || 'Unknown',
              targetAddress: mapping.targetAddress,
              amount: '0',
              txHash: 'N/A',
              status: 'failed',
              error: error.message || '交易失败',
              explorerUrl: 'N/A'
            })
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      setTransactionResults(results)
      const successCount = results.filter(r => r.status === 'success').length
      setIsProcessing(false)
      setIsSuccess(true)
      setStatus(`🎉 完成！成功: ${successCount}/${results.length}`)
      
    } catch (error: any) {
      setIsProcessing(false)
      setStatus(`❌ 批量操作失败: ${error.message}`)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl space-y-5">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
          MONAD 空投归集工具
        </h1>
        <p className="text-sm text-gray-600">支持多对一批量归集 & 多对多一对一转账</p>
      </header>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
        <p className="text-xs text-amber-800">警告：本工具涉及私钥操作，请务必在**离线/安全环境**中使用！</p>
      </div>

      {/* 网络选择 */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <span className="text-sm font-medium text-blue-800">
          当前网络: {useTestnet ? "Monad 测试网 (Chain ID: 10143)" : "Monad 主网 (Chain ID: 143)"}
        </span>
        <Button
          onClick={() => setUseTestnet(!useTestnet)}
          variant="outline"
          className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          切换到{useTestnet ? "主网" : "测试网"}
        </Button>
      </div>

      {/* 归集模式选择 */}
      <div className="space-y-3 pt-1 border-t border-gray-200">
        <label className="text-sm font-medium text-gray-700">归集模式:</label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setCollectionMode("MANY_TO_ONE")}
            variant="outline"
            className={`h-11 text-sm font-medium rounded-lg transition-all ${
              collectionMode === "MANY_TO_ONE"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-md hover:from-purple-700 hover:to-indigo-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            多对一归集 (批量到单一地址)
          </Button>
          <Button
            onClick={() => setCollectionMode("MANY_TO_MANY")}
            variant="outline"
            className={`h-11 text-sm font-medium rounded-lg transition-all ${
              collectionMode === "MANY_TO_MANY"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-md hover:from-purple-700 hover:to-indigo-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            多对多转账 (一对一配对)
          </Button>
        </div>
      </div>

      {collectionMode === "MANY_TO_ONE" && (
        <div className="space-y-2">
          <label htmlFor="target-address" className="text-sm font-medium text-gray-700">
            目标交易所钱包 (归集地址):
          </label>
          <Input
            id="target-address"
            type="text"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="0x..."
            className="h-10 text-sm font-mono border-gray-300 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
      )}

      {collectionMode === "MANY_TO_MANY" && (
        <div className="space-y-2">
          <label htmlFor="target-addresses" className="text-sm font-medium text-gray-700">
            目标地址列表 (每行一个地址，将按顺序一对一配对):
          </label>
          <textarea
            id="target-addresses"
            value={targetAddresses}
            onChange={(e) => setTargetAddresses(e.target.value)}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg text-xs font-mono placeholder:text-gray-400 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition resize-none"
            placeholder="0x1234...&#10;0x5678...&#10;0xabcd...&#10;&#10;每行一个地址，将按顺序与私钥配对&#10;如果私钥数量大于地址数量，将循环使用地址"
          />
          <Button
            onClick={handleParseTargets}
            variant="outline"
            className="w-full h-10 text-sm font-medium border-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50 rounded-lg bg-white"
          >
            解析目标地址 ({parsedTargets.length} 个已解析)
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="private-keys" className="text-sm font-medium text-gray-700">
          私钥列表 (每行一个):
        </label>
        <textarea
          id="private-keys"
          value={rawKeyInput}
          onChange={(e) => setRawKeyInput(e.target.value)}
          rows={10}
          className="w-full p-3 border border-gray-300 rounded-lg text-xs font-mono placeholder:text-gray-400 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition resize-none"
          placeholder={`格式支持:\n私钥 金额 (例: 0x... 0.05)\n私钥,金额 (例: 0x...,0.05)\n私钥=金额 (例: 0x...=0.05)\n或者仅私钥`}
        />
      </div>

      <div className="space-y-3 pt-1">
        <label className="text-sm font-medium text-gray-700">转账模式:</label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setTransferMode("ALL")}
            variant="outline"
            className={`h-11 text-sm font-medium rounded-lg transition-all ${
              transferMode === "ALL"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0 shadow-md hover:from-indigo-700 hover:to-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            归集所有余额(推荐)
          </Button>
          <Button
            onClick={() => setTransferMode("FIXED")}
            variant="outline"
            className={`h-11 text-sm font-medium rounded-lg transition-all ${
              transferMode === "FIXED"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0 shadow-md hover:from-indigo-700 hover:to-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            转账固定金额
          </Button>
        </div>
        {transferMode === "FIXED" && (
          <div className="pt-1">
            <Input
              id="fixed-amount"
              type="text"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="请输入统一转账金额，例如: 0.05"
              className="h-10 font-mono text-sm border-gray-300"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button
          onClick={handleParseKeys}
          disabled={isProcessing}
          variant="outline"
          className="h-11 text-sm font-medium border-2 border-blue-400 text-blue-600 hover:bg-blue-50 rounded-lg bg-white"
        >
          解析并检验私钥
        </Button>
        <Button
          onClick={handleSweep}
          disabled={isProcessing || parsedAccounts.filter((a) => a.valid).length === 0}
          className="h-11 text-sm font-medium text-white bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 shadow-md rounded-lg border-0"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在处理
            </>
          ) : (
            `开始${collectionMode === "MANY_TO_ONE" ? "批量归集" : "一对一转账"}`
          )}
        </Button>
      </div>

      {status && <div className="text-center text-sm font-medium text-gray-600 pt-2">{status}</div>}

      {/* 交易结果导出 */}
      {transactionResults.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">交易结果</h4>
            <Button
              onClick={() => exportToExcel(transactionResults)}
              variant="outline"
              className="h-9 text-xs border-green-500 text-green-600 hover:bg-green-50"
            >
              <Download className="mr-2 h-4 w-4" />
              导出为 Excel
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-2.5 font-semibold text-gray-600">#</th>
                  <th className="p-2.5 font-semibold text-gray-600">源地址</th>
                  <th className="p-2.5 font-semibold text-gray-600">目标地址</th>
                  <th className="p-2.5 font-semibold text-gray-600">金额</th>
                  <th className="p-2.5 font-semibold text-gray-600">状态</th>
                  <th className="p-2.5 font-semibold text-gray-600">交易</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactionResults.map((result, index) => (
                  <tr key={index}>
                    <td className="p-2.5 font-medium text-gray-500">{index + 1}</td>
                    <td className="p-2.5 font-mono text-gray-700 text-xs truncate max-w-[120px]">
                      {result.sourceAddress.slice(0, 8)}...{result.sourceAddress.slice(-6)}
                    </td>
                    <td className="p-2.5 font-mono text-gray-700 text-xs truncate max-w-[120px]">
                      {result.targetAddress.slice(0, 8)}...{result.targetAddress.slice(-6)}
                    </td>
                    <td className="p-2.5 font-semibold text-gray-700">{result.amount} MON</td>
                    <td className={`p-2.5 font-bold ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {result.status === 'success' ? '✓ 成功' : `✗ ${result.error}`}
                    </td>
                    <td className="p-2.5">
                      {result.status === 'success' ? (
                        <a
                          href={result.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          查看
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {collectionMode === "MANY_TO_MANY" && transferMappings.length > 0 && transactionResults.length === 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">转账映射关系预览</h4>
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="space-y-2 p-3">
              {transferMappings.map((mapping, index) => {
                const account = parsedAccounts.filter(a => a.valid)[mapping.sourceIndex]
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">源钱包 #{mapping.sourceIndex + 1}</div>
                      <div className="font-mono text-xs text-gray-700 truncate">
                        {account.address?.slice(0, 10)}...{account.address?.slice(-8)}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">目标地址</div>
                      <div className="font-mono text-xs text-gray-700 truncate">
                        {mapping.targetAddress.slice(0, 10)}...{mapping.targetAddress.slice(-8)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">金额</div>
                      <div className="font-semibold text-sm text-green-600">{mapping.amount}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {collectionMode === "MANY_TO_ONE" && parsedAccounts.length > 0 && transactionResults.length === 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">解析结果预览</h4>
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-12 p-2.5 font-semibold text-gray-600">#</th>
                  <th className="p-2.5 font-semibold text-gray-600">地址</th>
                  <th className="p-2.5 font-semibold text-gray-600">金额</th>
                  <th className="p-2.5 font-semibold text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedAccounts.map((acc, index) => (
                  <tr key={index}>
                    <td className="p-2.5 font-medium text-gray-500">{index + 1}</td>
                    <td className="truncate font-mono p-2.5 text-gray-700">
                      {acc.address ? `${acc.address.slice(0, 8)}...${acc.address.slice(-6)}` : 'N/A'}
                    </td>
                    <td className="p-2.5 font-semibold text-gray-700">
                      {acc.amount || (transferMode === "ALL" ? "全部" : fixedAmount)}
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
