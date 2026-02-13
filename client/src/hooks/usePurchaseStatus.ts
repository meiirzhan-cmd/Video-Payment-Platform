import { useEffect, useState } from 'react';
import * as paymentsApi from '@/api/payments';
import { useAuthStore } from '@/auth/auth-store';

export function usePurchaseStatus(videoId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoId || !user) {
      setOwned(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function check() {
      setLoading(true);
      try {
        const res = await paymentsApi.checkAccess(videoId!);
        if (!cancelled) setOwned(res.hasAccess);
      } catch {
        if (!cancelled) setOwned(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [videoId, user]);

  return { owned, loading };
}
