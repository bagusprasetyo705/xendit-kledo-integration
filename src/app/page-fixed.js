// app/dashboard/page.js
'use client';
import { useSession } from "next-auth/react";
import { useState } from "react";
import SyncStatus from "@/components/SyncStatus";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [transfers, setTransfers] = useState([
    {
      id: 1,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      invoice_id: "inv_12345",
      xendit_id: "xendit_67890",
      amount: 250000,
      status: "success"
    },
    {
      id: 2,
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      invoice_id: "inv_54321",
      xendit_id: "xendit_09876",
      amount: 150000,
      status: "success"
    }
  ]);

  const handleManualSync = async () => {
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setSyncResult(result);
      
      if (result.success) {
        // In a real app, you'd refetch the transfers from your database
        // For now, we'll just show the sync result
        console.log('Sync completed successfully');
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Xendit to Kledo Integration V1</h1>
      
      {session ? (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-2">Kledo Connection</h2>
            <p className="text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Connected as {session.user?.email || session.user?.name}
            </p>
          </div>

          {/* Manual Sync Trigger */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-2">Manual Sync</h2>
            <button 
              onClick={handleManualSync}
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
                  Syncing...
                </span>
              ) : (
                'Force Sync Now'
              )}
            </button>
            
            {syncResult && (
              <div className={`mt-4 p-3 rounded ${
                syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {syncResult.success ? (
                  <div>
                    <p className="text-green-800 font-medium">✅ Sync Completed</p>
                    <p className="text-green-700 text-sm">
                      Processed: {syncResult.processed}, Successful: {syncResult.successful}
                    </p>
                    {syncResult.errors && syncResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-700 text-sm font-medium">Errors:</p>
                        {syncResult.errors.map((error, index) => (
                          <p key={index} className="text-red-600 text-xs">
                            {error.transaction_id}: {error.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-800">❌ Sync Failed: {syncResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Recent Transfers Table */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-4">Recent Transfers</h2>
            <SyncStatus transfers={transfers} />
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <Link 
            href="/api/auth/signin" 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg inline-block"
          >
            Sign in with Kledo
          </Link>
          <p className="mt-4 text-gray-600">
            Authentication required to view transfer logs
          </p>
        </div>
      )}
    </div>
  );
}
