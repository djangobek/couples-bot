/* ============================================================
   useApi — small async state hook
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AsyncState } from "../types/domain";
import { humanizeError } from "../services/api";

export function useApi<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  options: { immediate?: boolean } = { immediate: true },
): {
  state: AsyncState<T>;
  refetch: () => Promise<void>;
} {
  const { immediate = true } = options;
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await fn();
      if (mounted.current) setState({ status: "success", data });
    } catch (err) {
      if (mounted.current)
        setState({ status: "error", error: humanizeError(err) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) void run();
  }, [run, immediate]);

  return { state, refetch: run };
}