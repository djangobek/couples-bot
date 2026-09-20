/* ============================================================
   TOAST — Global toast system
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = "info") => {
      counter += 1;
      const id = `t_${Date.now()}_${counter}`;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <ToastHost />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function colorFor(kind: ToastKind): string {
  switch (kind) {
    case "success":
      return "var(--success)";
    case "error":
      return "var(--danger)";
    default:
      return "var(--accent)";
  }
}

function ToastHost() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          style={{
            pointerEvents: "auto",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "var(--text-primary)",
            animation: "fadeInUp 220ms var(--ease-out)",
            cursor: "pointer",
            borderLeft: `3px solid ${colorFor(t.kind)}`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: colorFor(t.kind),
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}