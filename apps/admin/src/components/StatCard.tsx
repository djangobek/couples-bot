/* ============================================================
   STAT CARD — Dashboard
   ============================================================ */

type Trend = "up" | "down" | "flat";

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  trendValue,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  trend?: Trend;
  trendValue?: string;
}) {
  const trendColor =
    trend === "up"
      ? "var(--success)"
      : trend === "down"
        ? "var(--danger)"
        : "var(--text-tertiary)";

  const trendArrow =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div
      style={{
        padding: 18,
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "border-color 180ms var(--ease-out)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        {icon && (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {trend && trendValue && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: trendColor,
            }}
          >
            {trendArrow} {trendValue}
          </span>
        )}
      </div>

      {hint && (
        <span
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}