import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShoppingCart } from 'lucide-react';
import * as videosApi from '@/api/videos';
import * as paymentsApi from '@/api/payments';
import type { VideoResponse } from '@/lib/types';
import { formatPrice, formatDate, formatDuration } from '@/lib/format';
import { useAuthStore } from '@/auth/auth-store';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';
import VideoPlayer from '@/videos/components/VideoPlayer';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setIsLoading(true);
      try {
        const v = await videosApi.getById(id!);
        setVideo(v);

        if (user && v.status === 'READY') {
          const access = await paymentsApi.checkAccess(id!);
          setHasAccess(access.hasAccess);
          if (access.hasAccess) {
            const stream = await videosApi.getStreamUrl(id!);
            setHlsUrl(stream.hlsUrl);
          }
        }
      } catch {
        setError('Failed to load video');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [id, user]);

  const handleBuy = async () => {
    if (!video) return;
    setBuying(true);
    try {
      const checkout = await paymentsApi.createCheckout({ videoId: video.id });
      window.location.href = checkout.checkoutUrl;
    } catch {
      setError('Failed to start checkout');
      setBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-danger">
        {error ?? 'Video not found'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Player or thumbnail */}
      {hasAccess && hlsUrl ? (
        <VideoPlayer src={hlsUrl} />
      ) : (
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No preview available
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span>{formatDate(video.createdAt)}</span>
              {video.durationSecs != null && <span>{formatDuration(video.durationSecs)}</span>}
              <StatusBadge status={video.status} />
            </div>
          </div>

          {/* Buy or price */}
          {!hasAccess && user && video.status === 'READY' && (
            <Button onClick={handleBuy} loading={buying} size="lg">
              <ShoppingCart className="h-4 w-4" />
              {video.priceCents === 0 ? 'Get for free' : `Buy for ${formatPrice(video.priceCents)}`}
            </Button>
          )}
          {!user && video.status === 'READY' && (
            <span className="text-lg font-semibold text-primary">
              {video.priceCents === 0 ? 'Free' : formatPrice(video.priceCents)}
            </span>
          )}
        </div>

        {video.description && (
          <p className="whitespace-pre-line text-gray-700">{video.description}</p>
        )}
      </div>
    </div>
  );
}
