import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Button from '@/shared/components/Button';

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="mt-2 text-gray-500">
          Your purchase has been confirmed. You can now watch the video.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/purchases">
            <Button>View Purchases</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost">Browse More</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
