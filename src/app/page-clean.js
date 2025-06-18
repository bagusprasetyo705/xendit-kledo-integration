// app/page.js
'use client';
import { useState, useEffect } from "react";
import XenditTransactionTable from "../components/XenditTransactionTable";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  const fetchXenditTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/xendit/transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      
      const result = await response.json();
      setTransactions(result.data || []);
    } catch (error) {
      setError(error.message);
      console.error('Failed to fetch Xendit transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions on component mount
  useEffect(() => {
    fetchXenditTransactions();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Xendit Transaction Dashboard</h1>
      
      {/* API Status */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg mb-2">Xendit API Status</h2>
        <p className="text-green-600 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Connected to Xendit API
        </p>
      </div>

      {/* Refresh Button */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg mb-2">Refresh Transactions</h2>
        <button 
          onClick={fetchXenditTransactions}
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white font-medium ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </span>
          ) : (
            'Refresh Transactions'
          )}
        </button>
        
        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 border border-red-200">
            <p className="text-red-800">❌ Error: {error}</p>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg mb-4">Recent Xendit Transactions</h2>
        <XenditTransactionTable 
          transactions={transactions} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
