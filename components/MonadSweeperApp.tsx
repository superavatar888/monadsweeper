"use client"

import React, { useState } from "react"
import { parseEther } from "viem"
import { Button } from "@/components/ui/button" // 修正导入路径
import { Input } from "@/components/ui/input"   // 修正导入路径
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

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
  const [fixedAmount, setFixedAmount] = useState("0.05") 
  const [parsedAccounts, setParsedAccounts] = useState<AccountData[]>([])
  const [status, setStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false);

  const handleParseKeys = () => {
    setStatus("正在解析私钥...")
    setIsSuccess(false);
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
    setIsSuccess(false);
    setStatus(`开始归集 ${validAccounts.length} 个钱包，请在控制台关注交易详情...`);
    
    // 模拟归集循环 (替换为您的 Viem 脚本调用)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setIsProcessing(false);
    setIsSuccess(true);
    setStatus(`🎉 归集交易已发送！请检查区块链确认结果。`);
  }

  return ( // 确保这里的 return 是正确的起始点
    // 界面放大：使用 max-w-2xl 约束宽度，增加内边距和圆角
    <div className="max-w-2xl w-full mx-auto p-8 bg-white rounded-2xl shadow-2xl space-y-8">
      
      {/* 顶部标题和描述 */}
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-extrabold text-gray-900">
          MONAD 空投归集工具
        </h2>
        <p className="text-lg text-gray-600">
          从多个空投钱包批量发送 MON 代币到交易所。
        </p>
      </header>

      {/* 警告区域 */}
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded-lg flex items-center space-x-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium">
          警告：本工具涉及私钥操作，请务必在**离线/安全环境**中使用！
        </p>
      </div>

      {/* 目标地址输入 */}
      <div className="space-y-2">
        <label htmlFor="target-address" className="font-bold text-gray-700 block">
          目标交易所地址 (归集地址):
        </label>
        <Input
          id="target-address"
          type="text"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          placeholder="0x..."
          className="font-mono p-3 h-auto"
        />
      </div>

      {/* 私钥输入区 */}
      <div className="space-y-2">
        <label htmlFor="private-keys" className="font-bold text-gray-700 block">
          私钥列表 (每行一个):
        </label>
        <textarea
          id="private-keys"
          value={rawKeyInput}
          onChange={(e) => setRawKeyInput(e.target.value)}
          rows={25} 
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono placeholder:text-gray-400"
          placeholder="格式支持：&#10; 私钥 金额 (如: 0x... 0.05) &#10; 私钥,金额 (如: 0x...,0.05) &#10; 私钥=金额 (如: 0x...=0.05) &#10; 或仅填写私钥"
        />
      </div>
      
      {/* 归集模式设置 */}
      <div className="space-y-3 border-t pt-6">
        <h3 className="font-bold text-gray-700">转账模式:</h3>
        <div className="flex space-x-4">
          <Button
            variant={transferMode === 'ALL' ? 'default' : 'outline'}
            onClick={() => setTransferMode('ALL')}
            className="w-1/2 py-3"
          >
            归集所有余额 (推荐)
          </Button>
          <Button
            variant={transferMode === 'FIXED' ? 'default' : 'outline'}
            onClick={() => setTransferMode('FIXED')}
            className="w-1/2 py-3"
          >
            转账固定金额或每行指定金额
          </Button>
        </div>
        
        {transferMode === 'FIXED' && (
          <div className="pt-3">
            <label htmlFor="fixed-amount" className="text-sm font-medium">统一转账金额 (MON):</label>
            <Input
              id="fixed-amount"
              type="text"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="0.05"
              className="mt-1 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">如果私钥行中未指定金额，将使用此金额。**请确保账户余额大于此金额 + Gas 费。**</p>
          </div>
        )}
      </div>

      {/* 状态和按钮 */}
      <div className="flex space-x-4 pt-4 border-t">
        <Button onClick={handleParseKeys} disabled={isProcessing} variant="outline" className="w-1/2 h-12">
          解析并校验私钥
        </Button>
        <Button onClick={handleSweep} disabled={isProcessing || parsedAccounts.length === 0} variant={isSuccess ? 'default' : 'sweep'} className="w-1/2 h-12 text-lg">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 正在处理...
            </>
          ) : (
            isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" /> 交易已发送
              </>
            ) : (
              '开始批量归集'
            )
          )}
        </Button>
      </div>
      
      {/* 状态信息 */}
      {status && (
        <div className={`p-3 rounded-lg text-center font-medium flex items-center justify-center space-x-2 ${status.includes('错误') ? 'bg-red-100 text-red-700' : isSuccess ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {isSuccess && <CheckCircle className="h-5 w-5" />}
          {status.includes('错误') && <AlertTriangle className="h-5 w-5" />}
          <p>{status}</p>
        </div>
      )}

      {/* 解析结果预览 */}
      {parsedAccounts.length > 0 && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-bold mb-3">解析结果预览 ({parsedAccounts.length} 个钱包):</h4>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm table-fixed">
              <thead>
                <tr className="border-b bg-gray-100 sticky top-0">
                  <th className="w-10 p-2">#</th>
                  <th className="w-1/3">私钥 (部分)</th>
                  <th className="w-1/3">转账金额</th>
                  <th className="w-1/6">状态</th>
                </tr>
              </thead>
              <tbody>
                {parsedAccounts.map((acc, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-gray-100">
                    <td className="p-2">{index + 1}</td>
                    <td className="truncate font-mono p-2 text-xs">{acc.privateKey.slice(0, 10)}...</td>
                    <td className="p-2">
                      {acc.amount || (transferMode === 'ALL' ? '全部余额 - Gas' : fixedAmount)}
                    </td>
                    <td className={acc.valid ? 'text-green-600 p-2' : 'text-red-600 p-2'}>
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
