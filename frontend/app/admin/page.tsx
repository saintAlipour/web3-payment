"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// ⚠️ آدرس قرارداد جدید خود را اینجا قرار دهید
const CONTRACT_ADDRESS = "0x4ad325EdD15aEFa1d5385fb0D17ec4D4e89CB9D4";

const ABI = [
  "function owner() view returns (address)",
  "function withdrawNative() external",
  "function withdrawERC20(address tokenAddress) external"
];

export default function AdminPanel() {
  const [account, setAccount] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [contractBalance, setContractBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // تابع اتصال کیف پول و بررسی اینکه آیا کاربر مدیر است یا خیر
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        
        // گرفتن آدرس مالک قرارداد از بلاک‌چین
        const ownerAddress = await contract.owner();
        
        // بررسی اینکه آیا کیف پول متصل شده همان مالک است
        if (accounts[0].toLowerCase() === ownerAddress.toLowerCase()) {
          setIsOwner(true);
          fetchBalance(provider);
        } else {
          setIsOwner(false);
        }
      } catch (error) {
        console.error("Error connecting:", error);
      }
    }
  };

  // تابع گرفتن موجودی قرارداد
  const fetchBalance = async (provider: any) => {
    const balance = await provider.getBalance(CONTRACT_ADDRESS);
    setContractBalance(ethers.formatEther(balance));
  };

  // تابع برداشت وجه
  const handleWithdraw = async () => {
    try {
      setLoading(true);
      setStatus("در حال ارسال درخواست برداشت...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.withdrawNative();
      setStatus("در انتظار تایید شبکه...");
      await tx.wait();
      
      setStatus("✅ برداشت با موفقیت انجام شد!");
      fetchBalance(provider); // آپدیت موجودی
    } catch (error: any) {
      console.error(error);
      setStatus(`❌ خطا در برداشت: ${error.reason || "تراکنش ناموفق بود"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white font-sans">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-red-400">پنل مدیریت</h1>
          <Link href="/" className="text-sm text-blue-400 hover:underline">
            بازگشت به درگاه
          </Link>
        </div>

        {!account ? (
          <button 
            onClick={connectWallet} 
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-xl font-bold text-lg"
          >
            اتصال کیف پول (MetaMask)
          </button>
        ) : !isOwner ? (
          <div className="text-center p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200">
            ⛔ شما مالک این قرارداد نیستید. دسترسی ممنوع!
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/30 text-center">
              <p className="text-sm text-gray-300 mb-2">موجودی قرارداد (ETH)</p>
              <p className="text-3xl font-bold text-green-400">{contractBalance}</p>
            </div>

            <button 
              onClick={handleWithdraw} 
              disabled={loading || contractBalance === "0.0"}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-600 text-white transition-colors py-3 rounded-xl font-bold text-lg"
            >
              {loading ? "در حال پردازش..." : "برداشت تمام موجودی به کیف پول من"}
            </button>

            {status && (
              <div className="p-3 rounded-lg bg-slate-900 text-center text-sm border border-slate-700">
                {status}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}