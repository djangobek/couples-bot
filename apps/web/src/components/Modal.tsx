import { useEffect } from "react";
import { hapticTap } from "../services/telegram";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 440,
}: ModalProps) {
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
      onClick={() => {
        hapticTap("light");
        onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(6,3,10,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: 16,
        paddingBottom: "calc(16px + var(--safe-bottom))",
        animation: "fadeIn var(--dur-base) var(--ease-out)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          background:
            "linear-gradient(180deg, var(--surface-elevated), var(--surface))",
          borderRadius: 28,
          boxShadow:
            "var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.06)",
          border: "1px solid var(--border-strong)",
          padding: 28,
          animation: "fadeInUp var(--dur-base) var(--ease-out)",
          maxHeight: "88dvh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Grabber indicator */}
        <div
          aria-hidden
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "var(--border-strong)",
            margin: "0 auto 20px",
          }}
        />

        {title && (
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "var(--fs-xl)",
              fontWeight: 500,
              letterSpacing: "-0.015em",
              marginBottom: 12,
              color: "var(--text-primary)",
              textAlign: "center",
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