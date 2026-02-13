import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import * as videosApi from "@/api/videos";
import type { VideoResponse } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/format";
import { useAuthStore } from "@/auth/auth-store";
import { usePurchaseStatus } from "@/hooks/usePurchaseStatus";
import VideoPlayer from "@/videos/components/VideoPlayer";

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { owned, loading: accessLoading } = usePurchaseStatus(id);
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCreator = user && user.id === video?.creatorId;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [v, stream] = await Promise.all([
          videosApi.getById(id!),
          videosApi.getStreamUrl(id!),
        ]);
        if (!cancelled) {
          setVideo(v);
          setHlsUrl(stream.hlsUrl);
        }
      } catch {
        if (!cancelled) setError("Failed to load video");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUrlExpired = useCallback(async () => {
    if (!id) return null;
    try {
      const stream = await videosApi.getStreamUrl(id);
      setHlsUrl(stream.hlsUrl);
      return stream.hlsUrl;
    } catch {
      return null;
    }
  }, [id]);

  if (isLoading || accessLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Must be creator or have purchased access
  if (!isCreator && !owned) {
    return <Navigate to={`/videos/${id}`} replace />;
  }

  if (error || !video || !hlsUrl) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-danger">
        {error ?? "Video unavailable"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <VideoPlayer src={hlsUrl} onUrlExpired={handleUrlExpired} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span>{formatDate(video.createdAt)}</span>
          {video.durationSecs != null && (
            <span>{formatDuration(video.durationSecs)}</span>
          )}
        </div>
        {video.description && (
          <p className="mt-4 whitespace-pre-line text-gray-700">
            {video.description}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Shortcuts: Space (play/pause), Arrow keys (seek), F (fullscreen), M
        (mute)
      </p>
    </div>
  );
}
