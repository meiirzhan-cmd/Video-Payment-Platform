import { Loader2 } from 'lucide-react';
import { useVideoSearch } from '@/hooks/useVideoSearch';
import SearchBar from '@/videos/components/SearchBar';
import VideoCard from '@/videos/components/VideoCard';
import Pagination from '@/shared/components/Pagination';

export default function CatalogPage() {
  const { search, setSearch, page, setPage, data, isLoading, error } = useVideoSearch();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Explore Videos</h1>
        <div className="max-w-md">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-danger">{error}</div>
      )}

      {!isLoading && !error && data && (
        <>
          {data.content.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {search ? 'No videos found matching your search.' : 'No videos available yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.content.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
