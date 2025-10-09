"use client"

import React, { useState } from "react"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input"   

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
  const separators = [',', '='];
  let parts: string[] = [];
  let currentLine = line.trim();

  // 1. 尝试使用逗号或等号分割
  for (const sep of separators) {
    if (currentLine.includes(sep)) {
      parts = currentLine.split(sep).map(p => p.trim()).filter(p => p.length > 0);
      break;
    }
  }

  // 2. 如果没有特殊分隔符，尝试使用空格分割
  if (parts.length === 0) {
      parts = currentLine.split(/\s+/).map(p => p.trim()).filter(p => p.length > 0);
  }
  
  if (parts.length === 2) {
    return { privateKey: parts[0], amount: parts[1] };
  } else if (parts.length === 1) {
    return { privateKey: parts[0] };
  } else {
    return { privateKey: currentLine };
  }
};

export default function MonadSweeperApp() {
  const [targetAddress, setTargetAddress] = useState("")
  const [rawKeyInput, setRawKeyInput] = useState("")
  const [transferMode, setTransferMode] = useState<"ALL" | "FIXED">("ALL")
  const [fixedAmount, setFixedAmount] = useState("0.05") // 默认设置一个小的固定金额
  const [parsedAccounts, setParsedAccounts] = useState<AccountData[]>([])
  const [status, setStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleParseKeys = () => {
    setStatus("正在解析私钥...")
    const lines = rawKeyInput.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const results: AccountData[] = [];

    for (const line of lines) {
      const { privateKey, amount: lineAmount } = parseInputLine(line);
      let valid = true;
      let error = undefined;

      // 1. 私钥格式校验
      const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      // 检查是否为标准的 66 位十六进制字符串
      if (pk.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
        valid = false;
        error = "私钥格式错误";
      }

      // 2. 金额校验 (如果单独提供了金额)
      if (lineAmount) {
        try {
          parseEther(lineAmount as `${number}`)
        } catch {
          valid = false;
          error = "金额格式错误";
        }
      }

      results.push({ 
        privateKey: pk, 
        address: valid ? "待查询..." : undefined, 
        amount: lineAmount, 
        valid, 
        error 
      });
    }

    setParsedAccounts(results);
    setStatus(`已解析 ${results.length} 行，其中 ${results.filter(a => a.valid).length} 个有效私钥。`);
  }

  const handleSweep = async () => {
    // 实际的归集逻辑 (使用 Viem)
    // ⚠️ 警告：该代码是前端 UI 骨架，实际的私钥归集需要在 Node.js 环境中执行，或者使用 Viem 在前端执行，但前端执行涉及到私钥泄露风险，**不推荐**。此处仅为模拟。
    
    // 1. 校验目标地址
    if (!targetAddress || targetAddress.length !== 42 || !targetAddress.startsWith('0x')) {
        setStatus("错误：请输入有效的目标交易所地址 (0x...)。");
        return;
    }
    
    const validAccounts = parsedAccounts.filter(a => a.valid);
    if (validAccounts.length === 0) {
        setStatus("错误：没有有效的私钥可以进行归集。");
        return;
    }

    setIsProcessing(true);
    setStatus(`正在连接 Monad 网络并开始归集 ${validAccounts.length} 个钱包...`);
    
    // 实际的归集循环（此处仅为模拟）
    // await runViemSweepScript(validAccounts, targetAddress, transferMode, fixedAmount); 

    await new Promise(resolve => setTimeout(resolve, 5000));
    setIsProcessing(false);
    setStatus(`🎉 归集处理完成。请切换到 Monad 区块浏览器检查交易结果。`);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 text-center">
        Monad 空投批量归集工具
      </h2>
      <p className="text-sm text-center text-red-600">
        ⚠️ 警告：本工具涉及私钥操作，请务必在**离线/安全环境**中使用！
      </p>

      {/* 目标地址 */}
      <div className="space-y-2">
        <label htmlFor="target-address" className="font-semibold text-gray-700">目标交易所地址 (归集地址):</label>
        <Input
          id="target-address"
          type="text"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          placeholder="0x..."
          className="font-mono"
        />
      </div>

      {/* 私钥输入区 */}
      <div className="space-y-2">
        <label htmlFor="private-keys" className="font-semibold text-gray-700">私钥列表 (每行一个):</label>
        <textarea
          id="private-keys"
          value={rawKeyInput}
          onChange={(e) => setRawKeyInput(e.target.value)}
          rows={10}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
          placeholder="格式支持：&#10; 私钥 金额 (如: 0x... 0.05) &#10; 私钥,金额 (如: 0x...,0.05) &#10; 私钥=金额 (如: 0x...=0.05) &#10; 或仅填写私钥"
        />
      </div>
      
      {/* 归集模式设置 */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="font-semibold text-gray-700">转账模式:</h3>
        <div className="flex space-x-4">
          <Button
            variant={transferMode === 'ALL' ? 'default' : 'outline'}
            onClick={() => setTransferMode('ALL')}
            className="w-1/2"
          >
            归集所有余额 (推荐)
          </Button>
          <Button
            variant={transferMode === 'FIXED' ? 'default' : 'outline'}
            onClick={() => setTransferMode('FIXED')}
            className="w-1/2"
          >
            转账固定金额或每行指定金额
          </Button>
        </div>
        
        {transferMode === 'FIXED' && (
          <div className="pt-2">
            <label htmlFor="fixed-amount" className="text-sm">统一转账金额 (MON):</label>
            <Input
              id="fixed-amount"
              type="text"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="0.05"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">如果私钥行中未指定金额，将使用此金额。**请确保账户余额大于此金额 + Gas 费。**</p>
          </div>
        )}
      </div>

      {/* 状态和按钮 */}
      <div className="flex space-x-4 pt-4 border-t">
        <Button onClick={handleParseKeys} disabled={isProcessing} variant="outline" className="w-1/2">
          解析并校验私钥
        </Button>
        <Button onClick={handleSweep} disabled={isProcessing || parsedAccounts.length === 0} variant="sweep" className="w-1/2">
          {isProcessing ? '正在处理交易...' : '开始批量归集'}
        </Button>
      </div>
      
      {/* 状态信息 */}
      {status && (
        <div className={`p-3 rounded-lg text-center ${status.includes('错误') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {status}
        </div>
      )}

      {/* 解析结果预览 */}
      {parsedAccounts.length > 0 && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-bold mb-3">解析结果预览 ({parsedAccounts.length} 个钱包):</h4>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-sm table-fixed">
              <thead>
                <tr className="border-b">
                  <th className="w-10">#</th>
                  <th className="w-1/3">私钥 (部分)</th>
                  <th className="w-1/3">转账金额</th>
                  <th className="w-1/6">状态</th>
                </tr>
              </thead>
              <tbody>
                {parsedAccounts.map((acc, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td>{index + 1}</td>
                    <td className="truncate font-mono">{acc.privateKey.slice(0, 10)}...</td>
                    <td>
                      {acc.amount || (transferMode === 'ALL' ? '全部余额 - Gas' : fixedAmount)}
                    </td>
                    <td className={acc.valid ? 'text-green-600' : 'text-red-600'}>
                      {acc.valid ? '✅ 有效' : `❌ ${acc.error}`}
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