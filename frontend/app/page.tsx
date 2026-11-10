"use client";

import { useState } from "react";
import { ethers } from "ethers";

// این بخش برای رفع خطای تایپ‌اسکریپت است
declare global {
  interface Window {
    ethereum?: any;
  }
}

// فقط این خط را تغییر دهید: آدرس قرارداد جدید خود را اینجا بگذارید
const CONTRACT_ADDRESS = "0x4ad325EdD15aEFa1d5385fb0D17ec4D4e89CB9D4";

const ABI = [
  "function payWithNativeToken(string memory orderId) external payable",
  "function payWithERC20(address tokenAddress, uint256 amount, string memory orderId) external"
];

// آدرس تستی USDT در شبکه Sepolia
const TEST_USDT_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116A902379C7238"; 

export default function Home() {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [orderId, setOrderId] = useState("ORDER-001");
  const [currency, setCurrency] = useState("ETH"); // ETH یا USDT
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting:", error);
      }
    } else {
      alert("لطفاً کیف پول MetaMask را نصب کنید!");
    }
  };

  const handlePayment = async () => {
    if (!window.ethereum) return;
    
    try {
      setLoading(true);
      setStatus("در حال ارسال تراکنش...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      let tx;

      if (currency === "ETH") {
        // پرداخت با ETH
        tx = await contract.payWithNativeToken(orderId, {
          value: ethers.parseEther(amount),
        });
      } else {
        // پرداخت با USDT (توکن ERC-20)
        const tokenContract = new ethers.Contract(TEST_USDT_ADDRESS, [
          "function decimals() view returns (uint8)",
          "function approve(address spender, uint256 amount) returns (bool)"
        ], signer);
        
        const decimals = await tokenContract.decimals();
        const parsedAmount = ethers.parseUnits(amount, decimals);
        
        setStatus("در حال تایید توکن (Approve)...");
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, parsedAmount);
        await approveTx.wait();

        setStatus("در حال پرداخت...");
        tx = await contract.payWithERC20(TEST_USDT_ADDRESS, parsedAmount, orderId);
      }

      setStatus("در انتظار تایید شبکه...");
      await tx.wait();
      setStatus("✅ پرداخت با موفقیت انجام شد!");
      
    } catch (error: any) {
      console.error(error);
      setStatus(`❌ خطا: ${error.reason || "تراکنش ناموفق بود"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white font-sans">
      
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-400">Crypto Gateway</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">پرداخت امن با Web3</p>

        {!account ? (
          <button 
            onClick={connectWallet} 
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-xl font-bold text-lg"
          >
            اتصال کیف پول (MetaMask)
          </button>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-700/50 p-3 rounded-lg text-xs text-center text-slate-300 border border-slate-600">
              کیف پول متصل: <span className="font-mono text-blue-300">{account.slice(0,6)}...{account.slice(-4)}</span>
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-300">شماره سفارش (Order ID)</label>
              <input 
                type="text" 
                value={orderId} 
                onChange={(e) =>

setOrderId(e.target.value)} 
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-300">ارز پرداختی</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrency("ETH")}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${currency === "ETH" ? "bg-blue-600" : "bg-slate-700"}`}
                >
                  ETH
                </button>
                <button 
                  onClick={() => setCurrency("USDT")}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${currency === "USDT" ? "bg-green-600" : "bg-slate-700"}`}
                >
                  USDT (تستی)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-300">مبلغ ({currency})</label>
              <input 
                type="number" 
                step="0.001" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none" 
              />
            </div>

            <button 
              onClick={handlePayment} 
              disabled={loading}
              className="w-full mt-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-600 text-slate-900 transition-colors py-3 rounded-xl font-extrabold text-lg shadow-lg shadow-green-500/30"
            >
              {loading ? "در حال پردازش..." : "پرداخت کن"}
            </button>

            {status && (
              <div className="mt-4 p-3 rounded-lg bg-slate-900 text-center text-sm border border-slate-700">
                {status}
              </div>
            )}
          </div>
        )}
      </div>
      
      <p className="mt-8 text-xs text-slate-500">Powered by Hardhat & Next.js</p>
    </main>
  );
}