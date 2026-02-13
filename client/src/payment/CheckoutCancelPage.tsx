import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Button from '@/shared/components/Button';

export default function CheckoutCancelPage() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('videoId');

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <XCircle className="mx-auto h-16 w-16 text-warning" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment Cancelled</h1>
        <p className="mt-2 text-gray-500">
          Your payment was cancelled. No charges were made. You can always try again later.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {videoId && (
            <Link to={`/videos/${videoId}`}>
              <Button>Back to Video</Button>
            </Link>
          )}
          <Link to="/">
            <Button variant={videoId ? 'ghost' : 'primary'}>Browse Catalog</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
