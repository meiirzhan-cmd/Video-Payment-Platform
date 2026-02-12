import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Button from '@/shared/components/Button';

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <XCircle className="mx-auto h-16 w-16 text-warning" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment Cancelled</h1>
        <p className="mt-2 text-gray-500">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
