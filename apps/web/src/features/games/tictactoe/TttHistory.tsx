import { useEffect, useState } from "react";
import { Button } from "../../../components/Button";
import { Skeleton } from "../../../components/Skeleton";
import { api, humanizeError } from "../../../services/api";
import type { TttHistoryItem } from "./tictactoe-types";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMs / 3_600_000);
    const diffDay = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return "hozir";
    if (diffMin < 60) return `${diffMin} daq oldin`;
    if (diffHr < 24) return `${diffHr} soat oldin`;
    if (diffDay < 7) return `${diffDay} kun oldin`;

    return d.toLocaleDateString("uz-UZ", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "—";
  }
}

export function TttHistory({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<TttHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getTttHistory({ limit: 20 });
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(humanizeError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton height={80} radius="var(--radius-lg)" />
        <Skeleton height={80} radius="var(--radius-lg)" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          textAlign: "center",
          fontSize: "var(--fs-sm)",
          color: "var(--text-tertiary)",
        }}
      >
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          border: "1px dashed var(--border-strong)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>⭕</div>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Hali X-O o'yinlari o'tkazilmagan.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => {
        const resultColor =
          item.myResult === "WIN"
            ? "var(--success)"
            : item.myResult === "LOSS"
              ? "var(--danger)"
              : item.myResult === "DRAW"
                ? "var(--text-tertiary)"
                : "var(--warning)";

        const resultEmoji =
          item.myResult === "WIN"
            ? "🏆"
            : item.myResult === "LOSS"
              ? "💫"
              : item.myResult === "DRAW"
                ? "🤝"
                : item.myResult === "CANCELLED"
                  ? "⏸️"
                  : "⏳";

        const resultLabel =
          item.myResult === "WIN"
            ? "G'alaba"
            : item.myResult === "LOSS"
              ? "Mag'lubiyat"
              : item.myResult === "DRAW"
                ? "Durang"
                : item.myResult === "CANCELLED"
                  ? "Bekor qilindi"
                  : "Jarayonda";

        return (
          <div
            key={item.id}
            style={{
              padding: 14,
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: `fadeInUp 400ms var(--ease-out) ${i * 40}ms backwards`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(180,155,216,0.14), rgba(232,165,192,0.06))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
                border: "1px solid var(--border)",
              }}
              aria-hidden
            >
              {resultEmoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    color: resultColor,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {resultLabel}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                  ·
                </span>
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {formatDate(item.finishedAt ?? item.createdAt)}
                </span>
              </div>

              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {item.players.map((p, idx) => (
                  <span key={p.userId}>
                    <span
                      style={{
                        fontSize: 16,
                        marginRight: 4,
                      }}
                    >
                      {p.icon}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {p.firstName ?? "Siz"}
                    </span>
                    {idx < item.players.length - 1 && (
                      <span
                        style={{
                          color: "var(--text-tertiary)",
                          marginLeft: 6,
                        }}
                      >
                        vs
                      </span>
                    )}
                  </span>
                ))}
              </div>

              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: 4,
                }}
              >
                {item.size}×{item.size} · {item.winLength} ketma-ket
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                flexShrink: 0,
                letterSpacing: "0.08em",
              }}
            >
              {item.code}
            </div>
          </div>
        );
      })}
    </div>
  );
}