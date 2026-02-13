interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
