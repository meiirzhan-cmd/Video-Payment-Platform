import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import * as paymentsApi from '@/api/payments';
import type { PageResponse, PurchaseResponse } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/format';
import StatusBadge from '@/shared/components/StatusBadge';
import Pagination from '@/shared/components/Pagination';

export default function PurchasesPage() {
  const [data, setData] = useState<PageResponse<PurchaseResponse> | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const result = await paymentsApi.listPurchases(page);
        setData(result);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Purchases</h1>

      {isLoading && !data && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {data && (
        <>
          {data.content.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              You haven&apos;t purchased any videos yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Video</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.content.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/videos/${p.videoId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          View Video
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.amountCents === 0 ? 'Free' : formatPrice(p.amountCents)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
