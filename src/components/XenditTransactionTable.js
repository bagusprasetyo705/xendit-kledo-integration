export default function XenditTransactionTable({ transactions, isLoading, onSyncTransaction }) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-700 font-medium">Loading transactions...</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="font-medium">No transactions found.</p>
        <p className="text-sm mt-2">Check your Xendit API keys and try refreshing.</p>
      </div>
    );
  }

  const formatCurrency = (amount, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'settled':
      case 'paid':
        return 'text-green-800 bg-green-100 border-green-300';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100 border-yellow-300';
      case 'expired':
      case 'failed':
        return 'text-red-800 bg-red-100 border-red-300';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-300';
    }
  };

  const getSyncStatusColor = (syncStatus) => {
    switch (syncStatus?.toLowerCase()) {
      case 'synced':
        return 'text-green-800 bg-green-100';
      case 'pending':
        return 'text-orange-800 bg-orange-100';
      case 'failed':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const canSync = (transaction) => {
    return (transaction.status === 'SETTLED' || transaction.status === 'PAID') && 
           transaction.sync_status !== 'synced';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              External ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Payment Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Sync Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction, index) => (
            <tr key={transaction.id || index} className="hover:bg-gray-50 border-b border-gray-200">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                {formatDate(transaction.created || transaction.updated)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                {transaction.external_id || transaction.id?.substring(0, 8) + '...' || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatCurrency(transaction.amount, transaction.currency)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(transaction.status)}`}>
                  {transaction.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                <div>
                  <div className="font-medium">{transaction.customer_name}</div>
                  <div className="text-gray-500 text-xs">{transaction.customer_email || transaction.payer_email || '-'}</div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                {transaction.payment_method || transaction.payment_channel || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSyncStatusColor(transaction.sync_status)}`}>
                  {transaction.sync_status?.toUpperCase() || 'NOT SYNCED'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {canSync(transaction) && (
                  <button
                    onClick={() => onSyncTransaction && onSyncTransaction(transaction)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Sync to Kledo
                  </button>
                )}
                {transaction.sync_status === 'synced' && (
                  <span className="text-green-600 text-xs font-medium">✓ Synced</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 text-sm text-gray-700 text-center font-medium">
        Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        {transactions.filter(t => canSync(t)).length > 0 && (
          <span className="ml-2 text-blue-600">
            ({transactions.filter(t => canSync(t)).length} can be synced)
          </span>
        )}
      </div>
    </div>
  );
}
