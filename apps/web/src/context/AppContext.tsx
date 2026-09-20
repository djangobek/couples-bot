/* ============================================================
   APP CONTEXT v3 — StrictMode-aware, single-load
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, humanizeError } from "../services/api";
import {
  getInitData,
  initTelegram,
  applyTelegramTheme,
} from "../services/telegram";
import type { AuthMeResponse, CoupleData } from "../types/api";

type BootState =
  | { status: "booting" }
  | { status: "ready" }
  | { status: "error"; message: string };

type AppContextValue = {
  boot: BootState;
  me: AuthMeResponse | null;
  couple: CoupleData;
  reloadCouple: () => Promise<void>;
  reloadAll: () => Promise<void>;
  isMember: boolean;
  hasPartner: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<BootState>({ status: "booting" });
  const [me, setMe] = useState<AuthMeResponse | null>(null);
  const [couple, setCouple] = useState<CoupleData>(null);
  const bootStartedRef = useRef(false);

  const loadAll = useCallback(async (isRetry = false) => {
    setBoot({ status: "booting" });

    try {
      if (!getInitData()) {
        throw new Error(
          "Bu ilova faqat Telegram orqali ochilishi kerak.",
        );
      }

      const user = await api.authTelegram();
      setMe(user);

      let c: CoupleData = null;
      try {
        c = await api.getCouple();
      } catch {
        c = null;
      }
      setCouple(c);

      setBoot({ status: "ready" });
    } catch (err) {
      const message = humanizeError(err);

      if (!isRetry) {
        console.warn("[AppContext] Boot failed, retrying once…", message);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await loadAll(true);
        return;
      }

      setBoot({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    /* Guard against StrictMode double-invoke */
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;

    initTelegram();
    applyTelegramTheme();
    void loadAll();
  }, [loadAll]);

  const reloadCouple = useCallback(async () => {
    try {
      const c = await api.getCouple();
      setCouple(c);
    } catch {
      setCouple(null);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const value = useMemo<AppContextValue>(() => {
    const isMember = Boolean(couple?.couple?.id);
    const hasPartner = Boolean(couple?.partner);
    return { boot, me, couple, reloadCouple, reloadAll, isMember, hasPartner };
  }, [boot, me, couple, reloadCouple, reloadAll]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}