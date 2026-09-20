/* ============================================================
   useSubscription — hook
   Fetch + check subscription status
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { api, humanizeError } from "../../services/api";
import type { SubscriptionStatus } from "./subscription-types";

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSubscriptionStatus();
      setStatus(data);
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const check = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const data = await api.checkSubscription();
      setStatus(data);
      return data.isSubscribed;
    } catch (err) {
      setError(humanizeError(err));
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    status,
    loading,
    checking,
    error,
    reload: load,
    check,
  };
}