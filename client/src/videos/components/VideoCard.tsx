import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { VideoResponse } from '@/lib/types';
import { formatPrice, formatDuration } from '@/lib/format';
import StatusBadge from '@/shared/components/StatusBadge';

interface VideoCardProps {
  video: VideoResponse;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      to={`/videos/${video.id}`}
      className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video bg-gray-100">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No thumbnail
          </div>
        )}
        {video.durationSecs != null && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
            <Clock className="h-3 w-3" />
            {formatDuration(video.durationSecs)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-primary">
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {video.priceCents === 0 ? 'Free' : formatPrice(video.priceCents)}
          </span>
          <StatusBadge status={video.status} />
        </div>
      </div>
    </Link>
  );
}
