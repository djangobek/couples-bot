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

export function SkeletonCard() {
  return (
    <div
      style={{
        padding: 22,
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <Skeleton height={12} width="30%" radius="var(--radius-full)" />
      <Skeleton height={24} width="75%" />
      <Skeleton height={12} width="100%" />
      <Skeleton height={12} width="60%" />
    </div>
  );
}