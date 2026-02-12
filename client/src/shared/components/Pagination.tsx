import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600
          hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600
          hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
