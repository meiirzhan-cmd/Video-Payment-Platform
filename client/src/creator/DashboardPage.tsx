import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Film, DollarSign, ShoppingBag } from 'lucide-react';
import * as videosApi from '@/api/videos';
import * as paymentsApi from '@/api/payments';
import type { CreatorStatsResponse, PageResponse, VideoResponse } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/format';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';
import Pagination from '@/shared/components/Pagination';

export default function DashboardPage() {
  const [stats, setStats] = useState<CreatorStatsResponse | null>(null);
  const [videos, setVideos] = useState<PageResponse<VideoResponse> | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [s, v] = await Promise.all([
          paymentsApi.getCreatorStats(),
          videosApi.listCreatorVideos(page),
        ]);
        setStats(s);
        setVideos(v);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [page]);

  if (isLoading && !videos) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
        <Link to="/creator/upload">
          <Button>
            <Plus className="h-4 w-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-primary" />
              <span className="text-sm text-gray-500">Total Videos</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVideos}</p>
          </div>
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-secondary" />
              <span className="text-sm text-gray-500">Total Purchases</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPurchases}</p>
          </div>
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="text-sm text-gray-500">Total Earnings</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatPrice(stats.totalEarningsCents)}
            </p>
          </div>
        </div>
      )}

      {/* Video list */}
      {videos && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Videos</h2>
          {videos.content.length === 0 ? (
            <p className="text-gray-500">You haven&apos;t uploaded any videos yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Price</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {videos.content.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{v.title}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {v.priceCents === 0 ? 'Free' : formatPrice(v.priceCents)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(v.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/creator/videos/${v.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={videos.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
