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
  "function withdrawNative() external",
  "function owner() view returns (address)"
];

export default function AdminPage() {
  const [account, setAccount] = useState("");
  const [contractBalance, setContractBalance] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
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
      alert("Please install MetaMask!");
    }
  };

  const fetchContractData = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get contract balance
      const balance = await provider.getBalance(CONTRACT_ADDRESS);
      setContractBalance(ethers.formatEther(balance));

      // Check if the current user is the contract owner
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const contractOwner = await contract.owner();
      
      if (account.toLowerCase() === contractOwner.toLowerCase()) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (account) {
      fetchContractData();
    }
  }, [account]);

  const handleWithdraw = async () => {
    if (!window.ethereum) return;

    try {
      setLoading(true);
      setStatus("Sending withdrawal transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.withdrawNative();
      
      setStatus("Waiting for confirmation...");
      await tx.wait();

      setStatus("Withdrawal successful. Funds transferred to owner.");
      
      // Update balance after withdrawal
      fetchContractData();
      
    } catch (error: any) {
      console.error(error);
      if (error.code === "ACTION_REJECTED") {
        setStatus("Transaction rejected by user.");
      } else {
        setStatus(`Error: ${error.reason || "Only the owner can withdraw funds."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white font-sans" dir="ltr">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-2 text-red-400">Admin Dashboard</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">Contract Management</p>

        {!account ? (
          <button onClick={connectWallet} className="w-full bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-xl font-bold text-lg">
            Connect Wallet (MetaMask)
          </button>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-700/50 p-4 rounded-lg text-sm text-center border border-slate-600">
              <p className="text-slate-400 mb-1">Connected Wallet:</p>
              <p className="font-mono text-blue-300">{account}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-1">Contract Balance</p>
              <p className="text-3xl font-bold text-green-400">{contractBalance} ETH</p>
            </div>

            {isOwner ? (
              <button

onClick={handleWithdraw} 
                disabled={loading || contractBalance === "0.0"}
                className="w-full bg-red-500 hover:bg-red-400 disabled:bg-slate-600 text-white transition-colors py-3 rounded-xl font-extrabold text-lg shadow-lg shadow-red-500/30"
              >
                {loading ? "Processing..." : "Withdraw Funds"}
              </button>
            ) : (
              <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg text-center text-red-300 text-sm">
                You are not the contract owner. You cannot withdraw funds.
              </div>
            )}

            {status && (
              <div className="mt-4 p-3 rounded-lg bg-slate-900 text-center text-sm border border-slate-700 font-medium">
                {status}
              </div>
            )}
          </div>
        )}
      </div>
      
      <a href="/" className="mt-6 text-blue-400 hover:text-blue-300 text-sm underline">
        Back to Payment Page
      </a>
    </main>
  );
}