/* ============================================================
   BADGE — Status badges
   ============================================================ */

type Variant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default"
  | "accent";

type BadgeProps = {
  children: React.ReactNode;
  variant?: Variant;
  dot?: boolean;
};

const COLORS: Record<
  Variant,
  { bg: string; text: string; dot: string }
> = {
  success: {
    bg: "var(--success-soft)",
    text: "var(--success)",
    dot: "var(--success)",
  },
  warning: {
    bg: "var(--warning-soft)",
    text: "var(--warning)",
    dot: "var(--warning)",
  },
  danger: {
    bg: "var(--danger-soft)",
    text: "var(--danger)",
    dot: "var(--danger)",
  },
  info: {
    bg: "var(--info-soft)",
    text: "var(--info)",
    dot: "var(--info)",
  },
  accent: {
    bg: "var(--accent-soft)",
    text: "var(--accent-strong)",
    dot: "var(--accent)",
  },
  default: {
    bg: "var(--surface-elevated)",
    text: "var(--text-secondary)",
    dot: "var(--text-tertiary)",
  },
};

export function Badge({ children, variant = "default", dot = false }: BadgeProps) {
  const colors = COLORS[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: "var(--radius-full)",
        background: colors.bg,
        color: colors.text,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: colors.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}