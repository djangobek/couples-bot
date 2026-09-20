import { useToast } from "../hooks/useToast";

export function ToastHost() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(16px + var(--safe-top))",
        left: 0,
        right: 0,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "0 20px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          style={{
            pointerEvents: "auto",
            maxWidth: 420,
            width: "100%",
            padding: "14px 18px",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(30,24,32,0.96), rgba(22,18,23,0.96))",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid var(--border-strong)",
            boxShadow:
              "0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            color: "var(--text-primary)",
            fontSize: "var(--fs-sm)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "fadeInUp var(--dur-base) var(--ease-out)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: colorFor(t.kind),
              flexShrink: 0,
              boxShadow: `0 0 10px ${colorFor(t.kind)}`,
            }}
          />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function colorFor(kind: string): string {
  switch (kind) {
    case "success":
      return "var(--success)";
    case "error":
      return "var(--danger)";
    default:
      return "var(--accent)";
  }
}