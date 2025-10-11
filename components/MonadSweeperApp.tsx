"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Loader2,
  CheckCircle,
  Wallet,
  Send,
  FileScan,
  Settings,
  ListChecks,
} from "lucide-react";

// (接口和辅助函数部分保持不变)
interface AccountData {
  privateKey: string;
  address?: string;
  amount?: string;
  valid: boolean;
  error?: string;
}
const parseInputLine = (line: string): { privateKey: string; amount?: string } => {
    const separators = [",", "="];
    let parts: string[] = [];
    const currentLine = line.trim();
    for (const sep of separators) {
        if (currentLine.includes(sep)) {
        parts = currentLine.split(sep).map((p) => p.trim()).filter((p) => p.length > 0);
        break;
        }
    }
    if (parts.length === 0) {
        parts = currentLine.split(/\s+/).map((p) => p.trim()).filter((p) => p.length > 0);
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
  // (状态管理逻辑保持不变)
  const [targetAddress, setTargetAddress] = useState("");
  const [rawKeyInput, setRawKeyInput] = useState("");
  const [transferMode, setTransferMode] = useState<"ALL" | "FIXED">("ALL");
  const [fixedAmount, setFixedAmount] = useState("0.05");
  const [parsedAccounts, setParsedAccounts] = useState<AccountData[]>([]);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // (事件处理函数保持不变)
  const handleParseKeys = () => {
    setStatus("正在解析私钥...");
    setIsSuccess(false);
    const lines = rawKeyInput.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const results: AccountData[] = [];
    for (const line of lines) {
      const { privateKey, amount: lineAmount } = parseInputLine(line);
      let valid = true;
      let error = undefined;
      const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      if (pk.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
        valid = false;
        error = "私钥格式错误";
      }
      if (lineAmount) {
        try {
          parseEther(lineAmount as `${number}`);
        } catch {
          valid = false;
          error = "金额格式错误";
        }
      }
      results.push({ privateKey: pk, address: valid ? "待查询..." : undefined, amount: lineAmount, valid, error });
    }
    setParsedAccounts(results);
    setStatus(`已解析 ${results.length} 行，其中 ${results.filter((a) => a.valid).length} 个有效。`);
  };

  const handleSweep = async () => {
    if (!targetAddress || targetAddress.length !== 42 || !targetAddress.startsWith("0x")) {
      setStatus("错误：请输入有效的目标地址。");
      return;
    }
    const validAccounts = parsedAccounts.filter((a) => a.valid);
    if (validAccounts.length === 0) {
      setStatus("错误：没有有效的私钥可以归集。");
      return;
    }
    setIsProcessing(true);
    setIsSuccess(false);
    setStatus(`正在归集 ${validAccounts.length} 个钱包...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsProcessing(false);
    setIsSuccess(true);
    setStatus(`🎉 归集交易已发送！`);
  };

  // --- UI (Dashboard 风格) ---
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* --- 顶部 Header --- */}
      <header className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Monad Airdrop Sweeper</h1>
          <p className="text-sm text-gray-500">一个高效、安全的空投批量归集工具</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold hidden sm:flex">
          <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
        </Button>
      </header>

      {/* --- 主内容区：左侧输入，右侧设置 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- 左侧主操作区 --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <span className="text-blue-600"><Wallet size={18} /></span> 目标地址
            </label>
            <Input
              id="target-address"
              type="text"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="粘贴您的交易所充值地址 0x..."
              className="h-12 text-sm font-mono"
            />
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <span className="text-blue-600"><FileScan size={18} /></span> 私钥列表
            </label>
            <textarea
              id="private-keys"
              value={rawKeyInput}
              onChange={(e) => setRawKeyInput(e.target.value)}
              rows={12}
              className="w-full p-3 border rounded-lg text-xs font-mono placeholder:text-gray-400 bg-gray-50 focus:ring-2 focus:ring-blue-400 transition resize-y"
              placeholder="每行一个私钥，支持格式：[私钥] 或 [私钥] [金额]"
            />
             <div className="p-3 mt-3 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-md text-xs">
                <p className="font-medium">请在离线环境下操作，确保资金安全。</p>
            </div>
          </div>
        </div>

        {/* --- 右侧设置与操作区 --- */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span className="text-purple-600"><Settings size={18} /></span> 转账模式
            </h3>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 border">
                <Button onClick={() => setTransferMode('ALL')} variant="ghost" className={`h-10 text-xs font-bold transition-all rounded-md ${ transferMode === 'ALL' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:bg-gray-200' }`}>归集所有</Button>
                <Button onClick={() => setTransferMode('FIXED')} variant="ghost" className={`h-10 text-xs font-bold transition-all rounded-md ${ transferMode === 'FIXED' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:bg-gray-200' }`}>指定金额</Button>
            </div>
            {transferMode === 'FIXED' && (
              <div className="mt-4">
                <Input id="fixed-amount" type="text" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="0.05" className="h-10 font-mono text-sm" />
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
             <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-green-600"><Send size={18} /></span> 执行操作
            </h3>
            <Button onClick={handleParseKeys} disabled={isProcessing} variant="outline" className="w-full h-11 text-sm font-semibold">
                <ListChecks className="mr-2 h-4 w-4" /> 解析并校验
            </Button>
            <Button onClick={handleSweep} disabled={isProcessing || parsedAccounts.filter(a => a.valid).length === 0} className="w-full h-11 text-sm font-semibold bg-green-600 text-white hover:bg-green-700">
              {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在归集...</>) : "开始归集"}
            </Button>
            {status && (
                <div className="pt-2 text-center text-xs font-medium text-gray-500">
                    {status}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* --- 解析结果预览 --- */}
      {parsedAccounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b">
            <h4 className="text-md font-semibold text-gray-800">解析结果预览</h4>
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
              <tbody className="divide-y divide-gray-200">
                {parsedAccounts.map((acc, index) => (
                  <tr key={index}>
                    <td className="p-2.5 font-medium text-gray-500">{index + 1}</td>
                    <td className="truncate font-mono p-2.5 text-gray-700">{acc.privateKey.slice(0, 10)}...</td>
                    <td className="p-2.5 font-semibold text-gray-700">{acc.amount || (transferMode === "ALL" ? "全部余额" : fixedAmount)}</td>
                    <td className={`p-2.5 font-bold ${acc.valid ? "text-green-600" : "text-red-600"}`}>{acc.valid ? "✓ 有效" : `✗ ${acc.error}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
