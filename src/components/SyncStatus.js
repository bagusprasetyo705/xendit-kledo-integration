export default function SyncStatus({ transfers }) {
  if (!transfers || transfers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent transfers found.</p>
        <p className="text-sm mt-2">Use the manual sync button above to import transactions from Xendit.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kledo Invoice ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xendit ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (IDR)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transfers.map((transfer) => (
            <tr key={transfer.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                {new Date(transfer.date).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-blue-600">
                {transfer.invoice_id}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-600">
                {transfer.xendit_id}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                Rp {transfer.amount.toLocaleString('id-ID')}
              </td>
              <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                transfer.status === 'success' 
                  ? 'text-green-600' 
                  : transfer.status === 'failed'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-10 border">
                  {transfer.status === 'success' && '✅'}
                  {transfer.status === 'failed' && '❌'}
                  {transfer.status === 'pending' && '⏳'}
                  <span className="ml-1 capitalize">{transfer.status}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}