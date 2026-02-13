import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import * as paymentsApi from '@/api/payments';
import Button from '@/shared/components/Button';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('videoId');
  const [confirmed, setConfirmed] = useState(false);
  const [polling, setPolling] = useState(!!videoId);

  // Poll to confirm purchase is recorded (webhook may take a moment)
  useEffect(() => {
    if (!videoId) {
      setConfirmed(true);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    async function poll() {
      while (!cancelled && attempts < maxAttempts) {
        try {
          const res = await paymentsApi.checkAccess(videoId!);
          if (res.hasAccess) {
            if (!cancelled) {
              setConfirmed(true);
              setPolling(false);
            }
            return;
          }
        } catch {
          // ignore, retry
        }
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
      }
      // Timed out — show success anyway (webhook may still process)
      if (!cancelled) {
        setConfirmed(true);
        setPolling(false);
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [videoId]);

  if (polling) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Processing your purchase...</h1>
          <p className="mt-2 text-gray-500">This should only take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="mt-2 text-gray-500">
          Your purchase has been confirmed. You can now watch the video.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {confirmed && videoId && (
            <Link to={`/videos/${videoId}/watch`}>
              <Button>Start Watching</Button>
            </Link>
          )}
          <Link to="/purchases">
            <Button variant={videoId ? 'secondary' : 'primary'}>View Purchases</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost">Browse More</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
