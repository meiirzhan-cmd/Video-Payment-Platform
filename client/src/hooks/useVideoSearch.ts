import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';
import * as videosApi from '@/api/videos';
import type { PageResponse, VideoResponse } from '@/lib/types';

export function useVideoSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0));
  const [data, setData] = useState<PageResponse<VideoResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (page > 0) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, page, setSearchParams]);

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await videosApi.list(page, undefined, debouncedSearch || undefined);
      setData(result);
    } catch {
      setError('Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    search,
    setSearch,
    page,
    setPage,
    data,
    isLoading,
    error,
  };
}
