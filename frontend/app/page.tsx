"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Put your deployed contract address here
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "payer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "orderId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PaymentReceived",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "orderId",
        "type": "string"
      }
    ],
    "name": "payWithNativeToken",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawNative",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// 31337 is the Chain ID for local Hardhat Network
const TARGET_CHAIN_ID = BigInt(31337);

export default function Home() {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [orderId, setOrderId] = useState("ORDER-001");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : "");
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handlePayment = async () => {
    if (!window.ethereum) return;
    
    try {
      setLoading(true);
      setStatus("Checking network...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== TARGET_CHAIN_ID) {
        setStatus(`Error: Wrong network. Detected Chain ID: ${network.chainId}. Expected: 31337. Please switch MetaMask to Hardhat Local.`);
        setLoading(false);
        return;
      }

      setStatus("Waiting for transaction approval in MetaMask...");
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const parsedAmount = ethers.parseEther(amount);

      // Corrected call: Only passing orderId, amount goes into 'value'
      const tx = await contract.payWithNativeToken(orderId, {
        value: parsedAmount,
      });

      setStatus("Waiting for network confirmation...");
      await tx.wait();
      
      setStatus("Payment successful!");
      
    } catch (error: any) {
      console.error(error);
      if (error.code === "ACTION_REJECTED") {
        setStatus("Transaction rejected by user.");
      } else {
        setStatus(`Error: ${error.reason || error.message || "Transaction failed"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white font-sans" dir="ltr">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-400">Crypto Gateway</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">Secure Web3 Payment</p>

        {!account ? (
          <button onClick={connectWallet} className="w-full bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-xl font-bold text-lg">
            Connect Wallet (MetaMask)
          </button>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-700/50 p-3 rounded-lg text-xs text-center text-slate-300 border border-slate-600">
              Connected Wallet: <span className="font-mono text-blue-300">{account.slice(0,6)}...{account.slice(-4)}</span>
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-300">Order ID</label>
              <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-300">Amount (ETH)</label>
              <input type="number" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none" />
            </div>

            <button onClick={handlePayment} disabled={loading} className="w-full mt-4 bg-green-500 hover:bg-green-400 disabled:bg-slate-600 text-slate-900 transition-colors py-3 rounded-xl font-extrabold text-lg shadow-lg shadow-green-500/30">
              {loading ? "Processing..." : "Pay with ETH"}
            </button>

            {status && (
              <div className="mt-4 p-3 rounded-lg bg-slate-900 text-center text-sm border border-slate-700 font-medium">
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