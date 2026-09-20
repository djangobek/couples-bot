/* ============================================================
   AUTH CONTEXT — Telegram initData → server validation
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
import { adminApi, humanizeError } from "../lib/api";
import { getInitData, initTelegram, applyTelegramTheme } from "../lib/telegram";
import type { AdminMeResponse } from "../types/admin";

type BootState =
  | { status: "booting" }
  | { status: "ready" }
  | { status: "unauthorized"; message: string }
  | { status: "error"; message: string };

type AuthContextValue = {
  boot: BootState;
  me: AdminMeResponse | null;
  reload: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<BootState>({ status: "booting" });
  const [me, setMe] = useState<AdminMeResponse | null>(null);
  const booted = useRef(false);

  const load = useCallback(async () => {
    setBoot({ status: "booting" });

    try {
      if (!getInitData()) {
        throw new Error(
          "Bu panel faqat Telegram Mini App orqali ochilishi kerak.",
        );
      }

      const user = await adminApi.me();
      setMe(user);
      setBoot({ status: "ready" });
    } catch (err) {
      const message = humanizeError(err);
      /* Check if it's an auth / forbidden error */
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
        setBoot({ status: "unauthorized", message });
      } else {
        setBoot({ status: "error", message });
      }
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    initTelegram();
    applyTelegramTheme();
    void load();
  }, [load]);

  const value = useMemo<AuthContextValue>(
    () => ({ boot, me, reload: load }),
    [boot, me, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}