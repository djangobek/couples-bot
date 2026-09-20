export function LoadingScreen({ label }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", width: 64, height: 64 }}>
        {/* Outer glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.1,
            filter: "blur(30px)",
            animation: "breathe 2.4s ease-in-out infinite",
          }}
        />
        {/* Ring */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "2px solid var(--border-strong)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.9s linear infinite",
          }}
        />
      </div>
      {label && (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "var(--fs-base)",
            color: "var(--text-tertiary)",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </p>
      )}
    </div>
  );
}