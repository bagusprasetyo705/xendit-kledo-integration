// app/page.js
'use client';
import { useState, useEffect } from "react";
import XenditTransactionTable from "../components/XenditTransactionTable";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [authStatus, setAuthStatus] = useState('disconnected'); // disconnected, connecting, connected

  const fetchXenditTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Transactions fetched:', result);
      setTransactions(result.data || []);
    } catch (error) {
      setError(error.message);
      console.error('Failed to fetch Xendit transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToKledo = () => {
    setAuthStatus('connecting');
    // Redirect to new OAuth authorize endpoint
    window.location.href = '/api/oauth/authorize';
  };

  const disconnectFromKledo = async () => {
    try {
      const response = await fetch('/api/oauth/status', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setAuthStatus('disconnected');
        alert('Disconnected from Kledo successfully!');
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect from Kledo:', error);
      alert('Failed to disconnect from Kledo');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/oauth/status');
      const status = await response.json();
      
      setAuthStatus(status.connected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus('disconnected');
    }
  };

  const triggerManualSync = async () => {
    if (authStatus !== 'connected') {
      alert('Please connect to Kledo first!');
      return;
    }

    setIsLoading(true);
    setSyncStatus(null);
    
    try {
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setSyncStatus(result);
      
      // Refresh transactions after sync
      if (result.success) {
        await fetchXenditTransactions();
      }
    } catch (error) {
      setSyncStatus({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const syncSingleTransaction = async (transaction) => {
    if (authStatus !== 'connected') {
      alert('Please connect to Kledo first!');
      return;
    }

    try {
      console.log('🔄 Syncing single transaction:', transaction.id);
      
      const response = await fetch('/api/sync/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Transaction ${transaction.external_id || transaction.id} synced successfully!`);
        // Refresh transactions to update sync status
        await fetchXenditTransactions();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to sync transaction:', error);
      alert(`❌ Sync failed: ${error.message}`);
    }
  };

  // Check URL for auth success and check overall auth status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      setAuthStatus('connected');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check current auth status
      checkAuthStatus();
    }
  }, []);

  // Fetch transactions on component mount
  useEffect(() => {
    fetchXenditTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Xendit to Kledo Integration</h1>
          
          {/* User Authentication Status */}
          <div className="flex items-center space-x-4">
            {authStatus === 'connected' ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-700">Connected to Kledo</p>
                  <p className="text-gray-600">OAuth authenticated</p>
                </div>
                <button
                  onClick={disconnectFromKledo}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectToKledo}
                disabled={authStatus === 'connecting'}
                className={`px-6 py-2 rounded font-medium ${
                  authStatus === 'connecting'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {authStatus === 'connecting' ? 'Connecting...' : 'Connect to Kledo'}
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Xendit Status */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h2 className="font-semibold text-lg mb-2 text-gray-800">Xendit API Status</h2>
            <p className="text-green-700 flex items-center font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Connected to Xendit API
            </p>
            <p className="text-sm text-gray-600 mt-1">Webhooks configured and ready</p>
          </div>

          {/* Kledo Status */}
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h2 className="font-semibold text-lg mb-2 text-gray-800">Kledo API Status</h2>
            {authStatus === 'connected' ? (
              <div>
                <p className="text-green-700 flex items-center font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connected to Kledo API
                </p>
                <p className="text-sm text-gray-600 mt-1">OAuth authenticated and ready</p>
              </div>
            ) : (
              <div>
                <p className="text-red-700 flex items-center font-medium">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Not connected to Kledo
                </p>
                <p className="text-sm text-gray-600 mt-1">Click &quot;Connect to Kledo&quot; to authenticate</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
          <h2 className="font-semibold text-lg mb-4 text-gray-800">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={fetchXenditTransactions}
              disabled={isLoading}
              className={`px-4 py-2 rounded text-white font-medium ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
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

            <button 
              onClick={triggerManualSync}
              disabled={isLoading || authStatus !== 'connected'}
              className={`px-4 py-2 rounded text-white font-medium ${
                isLoading || authStatus !== 'connected'
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing...
                </span>
              ) : (
                'Manual Sync to Kledo'
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 rounded bg-red-100 border border-red-300">
              <p className="text-red-800 font-medium">❌ Error: {error}</p>
            </div>
          )}

          {syncStatus && (
            <div className={`mt-4 p-3 rounded border ${
              syncStatus.success 
                ? 'bg-green-100 border-green-300' 
                : 'bg-red-100 border-red-300'
            }`}>
              {syncStatus.success ? (
                <div className="text-green-800">
                  <p className="font-medium">✅ Sync completed successfully!</p>
                  <p className="text-sm mt-1">
                    Processed: {syncStatus.processed} | 
                    Successful: {syncStatus.successful} | 
                    Errors: {syncStatus.errors?.length || 0}
                  </p>
                  {syncStatus.errors && syncStatus.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Errors:</p>
                      {syncStatus.errors.map((error, index) => (
                        <p key={index} className="text-sm">
                          • {error.external_id || error.transaction_id}: {error.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-800 font-medium">❌ Sync failed: {syncStatus.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 className="font-semibold text-lg mb-4 text-gray-800">Recent Xendit Transactions</h2>
          <XenditTransactionTable 
            transactions={transactions} 
            isLoading={isLoading}
            onSyncTransaction={syncSingleTransaction}
          />
        </div>
      </div>
    </div>
  );
}