export default function XenditTransactionTable({ transactions, isLoading }) {
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Invoice ID
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
              Payment Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300">
              Payer Email
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction, index) => (
            <tr key={transaction.id || index} className="hover:bg-gray-50 border-b border-gray-200">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                {formatDate(transaction.created || transaction.updated)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-700 font-semibold">
                {transaction.id}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                {transaction.external_id || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                {formatCurrency(transaction.amount, transaction.currency)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(transaction.status)}`}>
                  {transaction.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                {transaction.payment_method || transaction.payment_channel || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                {transaction.payer_email || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 text-sm text-gray-700 text-center font-medium">
        Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
