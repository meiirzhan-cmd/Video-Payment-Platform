import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, LogIn, Pencil, Play, ShoppingCart } from 'lucide-react';
import * as videosApi from '@/api/videos';
import * as paymentsApi from '@/api/payments';
import type { VideoResponse } from '@/lib/types';
import { formatPrice, formatDate, formatDuration } from '@/lib/format';
import { useAuthStore } from '@/auth/auth-store';
import { usePurchaseStatus } from '@/hooks/usePurchaseStatus';
import StatusBadge from '@/shared/components/StatusBadge';
import Button from '@/shared/components/Button';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { owned, loading: accessLoading } = usePurchaseStatus(id);

  const isCreator = user && video && user.id === video.creatorId;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const v = await videosApi.getById(id!);
        if (!cancelled) setVideo(v);
      } catch {
        if (!cancelled) setError('Failed to load video');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

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

  const renderCta = () => {
    if (video.status !== 'READY') return null;

    // Creator viewing own video
    if (isCreator) {
      return (
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/videos/${video.id}/watch`)} size="lg">
            <Play className="h-4 w-4" />
            Watch Preview
          </Button>
          <Link to={`/creator/videos/${video.id}/edit`}>
            <Button variant="secondary" size="lg">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      );
    }

    // Not logged in
    if (!user) {
      return (
        <Link to="/login" state={{ from: { pathname: `/videos/${video.id}` } }}>
          <Button size="lg">
            <LogIn className="h-4 w-4" />
            Login to Purchase
          </Button>
        </Link>
      );
    }

    // Access still loading
    if (accessLoading) {
      return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    }

    // Already purchased
    if (owned) {
      return (
        <Button onClick={() => navigate(`/videos/${video.id}/watch`)} size="lg">
          <Play className="h-4 w-4" />
          Watch Now
        </Button>
      );
    }

    // Not purchased — buy button
    return (
      <Button onClick={handleBuy} loading={buying} size="lg">
        <ShoppingCart className="h-4 w-4" />
        {video.priceCents === 0 ? 'Get for free' : `Buy for ${formatPrice(video.priceCents)}`}
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Thumbnail preview */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No preview available
          </div>
        )}
      </div>

      {/* Info + CTA */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>{formatDate(video.createdAt)}</span>
              {video.durationSecs != null && <span>{formatDuration(video.durationSecs)}</span>}
              <StatusBadge status={video.status} />
              {video.priceCents === 0 ? (
                <span className="font-medium text-success">Free</span>
              ) : (
                <span className="font-medium text-primary">{formatPrice(video.priceCents)}</span>
              )}
            </div>
          </div>
          {renderCta()}
        </div>

        {video.description && (
          <p className="whitespace-pre-line text-gray-700">{video.description}</p>
        )}
      </div>
    </div>
  );
}
