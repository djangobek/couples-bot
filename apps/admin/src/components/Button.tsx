/* ============================================================
   BUTTON — Reusable
   ============================================================ */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const heights: Record<Size, number> = { sm: 30, md: 36, lg: 44 };
  const paddings: Record<Size, string> = {
    sm: "0 12px",
    md: "0 16px",
    lg: "0 22px",
  };
  const fontSizes: Record<Size, string> = {
    sm: "12px",
    md: "13px",
    lg: "14px",
  };

  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      color: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
    },
    secondary: {
      background: "var(--surface-elevated)",
      color: "var(--text-primary)",
      boxShadow: "inset 0 0 0 1px var(--border-strong)",
    },
    outline: {
      background: "transparent",
      color: "var(--text-primary)",
      boxShadow: "inset 0 0 0 1px var(--border-strong)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
    },
    danger: {
      background: "var(--danger)",
      color: "#fff",
    },
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: heights[size],
        padding: paddings[size],
        borderRadius: "var(--radius-md)",
        fontFamily: "inherit",
        fontSize: fontSizes[size],
        fontWeight: 500,
        letterSpacing: "-0.005em",
        transition:
          "transform 140ms var(--ease-out), opacity 140ms var(--ease-out), background 140ms var(--ease-out)",
        width: fullWidth ? "100%" : "auto",
        opacity: isDisabled ? 0.55 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...variants[variant],
        ...style,
      }}
    >
      {loading ? <Spinner size={size === "sm" ? 12 : 14} /> : children}
    </button>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
  );
}