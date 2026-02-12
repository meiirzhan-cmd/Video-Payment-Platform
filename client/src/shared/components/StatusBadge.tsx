import type { PurchaseStatus, VideoStatus } from '@/lib/types';

type Status = VideoStatus | PurchaseStatus;

const statusStyles: Record<Status, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  UPLOADING: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
