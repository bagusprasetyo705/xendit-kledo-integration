// app/dashboard/page.js
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import SyncStatus from "@/components/SyncStatus";
import { fetchRecentTransfers } from "@/lib/kledo-service";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const transfers = await fetchRecentTransfers();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Xendit to Kledo Integration</h1>
      
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

          {/* Manual Sync Trigger (Optional) */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-2">Manual Sync</h2>
            <form action="/api/sync/trigger" method="POST">
              <button 
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Force Sync Now
              </button>
            </form>
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
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg"
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