/* ============================================================
   EMPTY STATE
   ============================================================ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: 12,
        textAlign: "center",
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--surface-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            fontSize: 24,
            marginBottom: 4,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            maxWidth: 360,
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}