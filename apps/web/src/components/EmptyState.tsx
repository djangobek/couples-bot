type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "48px 24px 40px",
        gap: 16,
        background: "var(--surface)",
        borderRadius: "var(--radius-2xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        position: "relative",
        overflow: "hidden",
        animation: "fadeInUp 500ms var(--ease-out)",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.06,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {icon && (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, var(--accent-soft), var(--violet-soft))",
            color: "var(--accent)",
            border: "1px solid var(--border-accent)",
            marginBottom: 4,
            boxShadow: "0 8px 24px var(--accent-tint)",
            position: "relative",
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--fs-lg)",
          fontWeight: 500,
          letterSpacing: "-0.015em",
          color: "var(--text-primary)",
          maxWidth: 300,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 300,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}

      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}