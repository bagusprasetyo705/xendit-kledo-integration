export default function SyncStatus({ transfers }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Invoice ID</th>
            <th className="px-4 py-2 text-left">Amount</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <tr key={transfer.id}>
              <td className="px-4 py-2">{new Date(transfer.date).toLocaleString()}</td>
              <td className="px-4 py-2 font-mono">{transfer.invoice_id}</td>
              <td className="px-4 py-2">{transfer.amount.toLocaleString()}</td>
              <td className={`px-4 py-2 ${
                transfer.status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transfer.status === 'success' ? '✅' : '❌'} {transfer.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}