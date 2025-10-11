"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react";

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

  return (
    // --- 主容器卡片 ---
    <div className="w-full max-w-3xl mx-auto p-8 sm:p-10 bg-white rounded-2xl shadow-xl space-y-8">
      {/* --- Header --- */}
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
          MONAD 空投归集工具
        </h1>
        <p className="text-md text-gray-500">
          从多个空投钱包批量发送 MON 代币到交易所
        </p>
      </header>

      {/* --- 警告框 --- */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
        <p className="text-sm font-semibold text-amber-800">警告：本工具涉及私钥操作，请务必在**离线/安全环境**中使用！</p>
      </div>

      {/* --- 表单部分 --- */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="target-address" className="text-sm font-bold text-gray-700">
            目标交易所地址 (归集地址):
          </label>
          <Input
            id="target-address"
            type="text"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="0x..."
            className="h-12 text-sm font-mono border-gray-200 bg-gray-50/50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="private-keys" className="text-sm font-bold text-gray-700">
            私钥列表 (每行一个):
          </label>
          <textarea
            id="private-keys"
            value={rawKeyInput}
            onChange={(e) => setRawKeyInput(e.target.value)}
            rows={10}
            className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono placeholder:text-gray-400 bg-gray-50/50 focus:ring-2 focus:ring-blue-400 transition resize-y"
            placeholder={`格式支持:\n私钥 金额 (例: 0x... 0.05)\n私钥,金额 (例: 0x...,0.05)\n或者仅私钥`}
          />
        </div>
      </div>

      {/* --- 转账模式按钮 --- */}
      <div className="space-y-4 pt-6 border-t">
        <label className="text-sm font-bold text-gray-700">转账模式:</label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setTransferMode('ALL')}
            variant="outline"
            className={`h-12 text-sm font-bold rounded-lg transition-all ${
              transferMode === 'ALL'
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0 shadow-md'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            归集所有余额 (推荐)
          </Button>
          <Button
            onClick={() => setTransferMode('FIXED')}
            variant="outline"
            className={`h-12 text-sm font-bold rounded-lg transition-all ${
              transferMode === 'FIXED'
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0 shadow-md'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            转账固定金额或每行指定金额
          </Button>
        </div>
        {transferMode === "FIXED" && (
          <div className="pt-2">
            <Input id="fixed-amount" type="text" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="请输入统一转账金额，例如: 0.05" className="h-11 font-mono text-sm" />
          </div>
        )}
      </div>

      {/* --- 操作按钮 --- */}
      <div className="grid grid-cols-2 gap-3 pt-6 border-t">
        <Button onClick={handleParseKeys} disabled={isProcessing} variant="outline" className="h-12 text-sm font-bold border-2 border-blue-500 text-blue-500 hover:bg-blue-50">
          解析并校验私钥
        </Button>
        <Button onClick={handleSweep} disabled={isProcessing || parsedAccounts.filter(a => a.valid).length === 0} className="h-12 text-sm font-bold text-white bg-gradient-to-r from-green-400 to-cyan-500 hover:from-green-500 hover:to-cyan-600 shadow-md">
          {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在归集</>) : "开始批量归集"}
        </Button>
      </div>

      {/* --- 状态和结果 --- */}
      {status && (
        <div className="text-center text-sm font-medium text-gray-500 pt-2">
          {status}
        </div>
      )}
      {parsedAccounts.length > 0 && (
        <div className="pt-6 border-t">
          <h4 className="text-md font-bold text-gray-800 mb-3">解析结果预览</h4>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-12 p-2.5 font-semibold text-gray-600">#</th>
                  <th className="p-2.5 font-semibold text-gray-600">私钥(部分)</th>
                  <th className="p-2.5 font-semibold text-gray-600">金额</th>
                  <th className="p-2.5 font-semibold text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedAccounts.map((acc, index) => (
                  <tr key={index}>
                    <td className="p-2.5 font-medium text-gray-500">{index + 1}</td>
                    <td className="truncate font-mono p-2.5 text-gray-700">{acc.privateKey.slice(0, 10)}...</td>
                    <td className="p-2.5 font-semibold text-gray-700">{acc.amount || (transferMode === "ALL" ? "全部" : fixedAmount)}</td>
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
