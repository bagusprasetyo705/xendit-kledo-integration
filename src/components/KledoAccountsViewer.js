// Components for displaying Kledo finance accounts
'use client';

import React, { useState, useEffect } from 'react';

export default function KledoAccountsViewer() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updateStatus, setUpdateStatus] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [accountIdTest, setAccountIdTest] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kledo/accounts');
      const data = await response.json();
      
      if (data.success) {
        // Ensure accounts is always an array
        const accountsArray = Array.isArray(data.accounts) ? data.accounts : [];
        setAccounts(accountsArray);
        console.log('✅ Accounts loaded:', accountsArray);
      } else {
        setError(data.error);
        setAccounts([]); // Reset to empty array on error
      }
    } catch (err) {
      setError('Failed to fetch accounts: ' + err.message);
      console.error('❌ Error:', err);
      setAccounts([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const updateAccountId = async (accountId, accountName) => {
    if (!confirm(`Are you sure you want to update the finance account ID to ${accountId} (${accountName})?\n\nThis will update the runtime configuration and affect all future invoice creations in this session.`)) {
      return;
    }

    setUpdateStatus({ loading: true, accountId });
    
    try {
      const response = await fetch('/api/kledo/update-account-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUpdateStatus({ success: true, accountId, accountName: data.accountName, previousId: data.previousId });
        alert(`✅ Success!\n\nFinance account ID updated to ${accountId}\nAccount: ${data.accountName}\n\nNote: ${data.note}\n\nThe change is now active for all new invoice creations in this session.`);
      } else {
        setUpdateStatus({ error: data.error, accountId });
        alert(`❌ Failed to update account ID: ${data.error}`);
      }
    } catch (err) {
      setUpdateStatus({ error: err.message, accountId });
      alert(`❌ Error updating account ID: ${err.message}`);
    }
  };

  const debugAccounts = async () => {
    setLoading(true);
    setError(null);
    setDebugData(null);
    
    try {
      const response = await fetch('/api/kledo/debug-accounts');
      const data = await response.json();
      
      setDebugData(data);
      console.log('🔍 Debug data:', data);
      
      if (!data.success) {
        setError(`Debug Error: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to fetch debug data: ' + err.message);
      console.error('❌ Debug Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/kledo/debug-info');
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      console.error('❌ Error fetching debug info:', err);
    }
  };

  const testAccountId = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kledo/test-account-id');
      const data = await response.json();
      setAccountIdTest(data);
    } catch (err) {
      console.error('❌ Error testing account ID:', err);
      setAccountIdTest({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch debug info on component mount
  useEffect(() => {
    fetchDebugInfo();
  }, []);

  // Filter accounts based on search term
  const filteredAccounts = Array.isArray(accounts) ? accounts.filter(account =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.id?.toString().includes(searchTerm) ||
    account.type?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🏦 Kledo Finance Accounts
        </h2>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                🔄 Fetch Accounts
              </>
            )}
          </button>
          
          <button
            onClick={debugAccounts}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Debugging...
              </>
            ) : (
              <>
                🐛 Debug Raw API
              </>
            )}
          </button>
          
          <button
            onClick={fetchDebugInfo}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Refreshing...
              </>
            ) : (
              <>
                🔧 Refresh Debug Info
              </>
            )}
          </button>
          
          <button
            onClick={testAccountId}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Testing...
              </>
            ) : (
              <>
                🧪 Test Account ID
              </>
            )}
          </button>

          {accounts.length > 0 && (
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Update Status Display */}
        {updateStatus && updateStatus.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-700 font-medium">Account ID Updated Successfully!</span>
            </div>
            <p className="text-green-600 mt-1">
              Finance account ID changed from <code className="bg-green-100 px-1 rounded">{updateStatus.previousId}</code> to <code className="bg-green-100 px-1 rounded">{updateStatus.accountId}</code>
            </p>
            <p className="text-green-600 text-sm mt-1">Account: {updateStatus.accountName}</p>
          </div>
        )}

        {/* Debug Data Display */}
        {debugData && (
          <div className="mb-6 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <h3 className="text-white font-bold mb-2">🐛 Raw API Debug Data</h3>
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Info Display */}
        {debugInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-900 font-bold mb-3">🔧 API Debug Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="mb-2">
                  <span className="font-medium text-blue-800">API Base URL:</span>
                  <br />
                  <code className="bg-blue-100 px-2 py-1 rounded text-sm break-all">
                    {debugInfo.apiUrl || 'Not available'}
                  </code>
                </p>
                <p className="mb-2">
                  <span className="font-medium text-blue-800">Current Account ID:</span>
                  <br />
                  <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                    {debugInfo.currentAccountId || 'Not set'}
                  </code>
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <span className="font-medium text-blue-800">Access Token (First 20 chars):</span>
                  <br />
                  <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                    {debugInfo.accessTokenPreview || 'Not available'}
                  </code>
                </p>
                <p className="mb-2">
                  <span className="font-medium text-blue-800">Connection Status:</span>
                  <br />
                  <span className={`px-2 py-1 rounded text-sm ${
                    debugInfo.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.isConnected ? '✅ Connected' : '❌ Not Connected'}
                  </span>
                </p>
              </div>
            </div>
            
            {debugInfo.accessToken && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 font-medium mb-2">⚠️ Full Access Token (for Kledo app debugging):</p>
                <div className="bg-yellow-100 p-2 rounded font-mono text-xs break-all">
                  {debugInfo.accessToken}
                </div>
                <p className="text-yellow-700 text-xs mt-2">
                  Copy this token to use in Kledo app or Postman for API testing
                </p>
              </div>
            )}
          </div>
        )}

        {/* Account ID Test Result Display */}
        {accountIdTest && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-purple-900 font-bold mb-3">🔍 Account ID Test Result</h3>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">
              {JSON.stringify(accountIdTest, null, 2)}
            </pre>
          </div>
        )}

        {/* Account ID Test Results */}
        {accountIdTest && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-orange-900 font-bold mb-3">🧪 Account ID Test Results</h3>
            {accountIdTest.success ? (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1">
                      <span className="font-medium text-orange-800">Configured ID:</span>
                      <code className="bg-orange-100 px-2 py-1 rounded text-sm ml-2">
                        {accountIdTest.test.configuredAccountId}
                      </code>
                    </p>
                    <p className="mb-1">
                      <span className="font-medium text-orange-800">Final ID (number):</span>
                      <code className="bg-orange-100 px-2 py-1 rounded text-sm ml-2">
                        {accountIdTest.test.fixedAccountId}
                      </code>
                    </p>
                    <p className="mb-1">
                      <span className="font-medium text-orange-800">Type:</span>
                      <span className="ml-2">{accountIdTest.test.typeOfAccountId}</span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-1">
                      <span className="font-medium text-orange-800">Validation Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        accountIdTest.test.validation?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {accountIdTest.test.validation?.ok ? '✅ Valid' : '❌ Invalid'}
                      </span>
                    </p>
                    {accountIdTest.test.validation?.data && (
                      <p className="mb-1">
                        <span className="font-medium text-orange-800">Account Name:</span>
                        <span className="ml-2">{accountIdTest.test.validation.data.data?.name || 'Unknown'}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-orange-100 rounded">
                  <p className="font-medium text-orange-800 mb-2">Sample Invoice Item:</p>
                  <pre className="text-xs bg-white p-2 rounded overflow-auto">
                    {JSON.stringify(accountIdTest.sampleInvoiceItem, null, 2)}
                  </pre>
                </div>
                
                {accountIdTest.test.validation?.error && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                    <p className="font-medium text-red-800 mb-1">Validation Error:</p>
                    <p className="text-red-700 text-sm">{accountIdTest.test.validation.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <p className="font-medium">Test Failed:</p>
                <p className="text-sm">{accountIdTest.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-600">❌</span>
              <span className="text-red-700 font-medium">Error:</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Accounts Count */}
        {accounts.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">
              ✅ Found <strong>{filteredAccounts.length}</strong> accounts 
              {searchTerm && ` matching "${searchTerm}"`}
              {filteredAccounts.length !== accounts.length && ` (${accounts.length} total)`}
            </p>
          </div>
        )}

        {/* Accounts Table */}
        {filteredAccounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Account ID</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Name</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Code</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Type</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Balance</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Status</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Category</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account, index) => (
                  <tr key={account.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-3 font-mono text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        {account.id}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 font-medium">
                      {account.name}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 font-mono text-sm">
                      {account.code || '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        account.type === 'Revenue' ? 'bg-green-100 text-green-800' :
                        account.type === 'Expense' ? 'bg-red-100 text-red-800' :
                        account.type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                        account.type === 'Liability' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {account.type || 'N/A'}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-right font-mono">
                      {account.balance !== null ? 
                        new Intl.NumberFormat('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR' 
                        }).format(account.balance) : 
                        '-'
                      }
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        account.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm">
                      {account.category || '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(account.id);
                            alert(`Account ID ${account.id} copied to clipboard!`);
                          }}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Copy ID
                        </button>
                        <button
                          onClick={() => updateAccountId(account.id, account.name)}
                          disabled={updateStatus?.loading && updateStatus.accountId === account.id}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {updateStatus?.loading && updateStatus.accountId === account.id ? 'Updating...' : 'Use This ID'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recommended Accounts for Revenue */}
        {accounts.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Recommended Accounts for Invoice Items
            </h3>
            <div className="space-y-2">
              {Array.isArray(accounts) ? accounts
                .filter(account => 
                  account.type === 'Revenue' || 
                  account.name?.toLowerCase().includes('revenue') ||
                  account.name?.toLowerCase().includes('sales') ||
                  account.name?.toLowerCase().includes('income') ||
                  account.name?.toLowerCase().includes('pendapatan')
                )
                .slice(0, 5)
                .map(account => (
                  <div key={account.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium">{account.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({account.code})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-600">ID: {account.id}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(account.id);
                          alert(`Account ID ${account.id} copied to clipboard!`);
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Copy ID
                      </button>
                      <button
                        onClick={() => updateAccountId(account.id, account.name)}
                        disabled={updateStatus?.loading}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Use This ID
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500">No accounts available</p>
                )}
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📋 How to Use Account IDs
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Revenue accounts</strong> are typically used for invoice line items</li>
            <li>• Copy the Account ID and update your <code>finance_account_id</code> in the code</li>
            <li>• Current fixed Account ID in code: <code className="bg-yellow-100 px-1 rounded">1-10001</code></li>
            <li>• Look for accounts with type &quot;Revenue&quot; or names containing &quot;Sales&quot;, &quot;Income&quot;, or &quot;Pendapatan&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
