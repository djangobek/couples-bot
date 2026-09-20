/* ============================================================
   MODAL — Confirmation dialog
   ============================================================ */

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 480,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        padding: 20,
        animation: "fadeIn 180ms var(--ease-out)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          background: "var(--surface-elevated)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-xl)",
          padding: 24,
          animation: "scaleIn 220ms var(--ease-out)",
        }}
      >
        {title && (
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}