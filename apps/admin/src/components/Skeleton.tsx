/* ============================================================
   SKELETON — Loading placeholder
   ============================================================ */

export function Skeleton({
  height = 16,
  width = "100%",
  radius = "var(--radius-md)",
  style,
}: {
  height?: number | string;
  width?: number | string;
  radius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, var(--surface) 0%, var(--surface-elevated) 50%, var(--surface) 100%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.6s linear infinite",
        ...style,
      }}
    />
  );
}