/* ============================================================
   STATISTICS PAGE — time series
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { StatCard } from "../components/StatCard";
import { Skeleton } from "../components/Skeleton";
import { Badge } from "../components/Badge";
import { formatNumber } from "../lib/format";
import type { StatisticsResponse, StatPeriod } from "../types/admin";

const PERIODS: Array<{ value: StatPeriod; label: string }> = [
  { value: "today", label: "Bugun" },
  { value: "7d", label: "7 kun" },
  { value: "30d", label: "30 kun" },
  { value: "90d", label: "90 kun" },
];

export function StatisticsPage() {
  const [period, setPeriod] = useState<StatPeriod>("7d");
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.statistics({ period }));
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Period selector */}
      <div
        style={{
          display: "inline-flex",
          padding: 4,
          borderRadius: "var(--radius-md)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          alignSelf: "flex-start",
          gap: 2,
        }}
      >
        {PERIODS.map((p) => {
          const active = period === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                border: "none",
                transition: "all 140ms var(--ease-out)",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={120} radius="var(--radius-lg)" />
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Totals */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <StatCard
              label="Yangi foydalanuvchilar"
              value={formatNumber(
                data.users.registrations.reduce((s, d) => s + d.value, 0),
              )}
              icon="👥"
            />
            <StatCard
              label="Faol foydalanuvchilar"
              value={formatNumber(
                data.users.activeUsers.reduce((s, d) => s + d.value, 0),
              )}
              icon="⚡"
            />
            <StatCard
              label="O'yinlar"
              value={formatNumber(
                data.games.sessions.reduce((s, d) => s + d.value, 0),
              )}
              icon="🎮"
            />
            <StatCard
              label="Yangi juftliklar"
              value={formatNumber(
                data.couples.created.reduce((s, d) => s + d.value, 0),
              )}
              icon="💑"
            />
          </div>

          {/* Time series */}
          <TimeSeriesChart
            title="Kunlik ro'yxatdan o'tish"
            data={data.users.registrations}
            color="var(--accent)"
          />

          <TimeSeriesChart
            title="Faol foydalanuvchilar"
            data={data.users.activeUsers}
            color="var(--success)"
          />

          <TimeSeriesChart
            title="Kunlik o'yinlar"
            data={data.games.sessions}
            color="var(--warning)"
          />

          <TimeSeriesChart
            title="Kunlik juftliklar"
            data={data.couples.created}
            color="var(--info)"
          />

          {/* By type / status */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            <BreakdownCard
              title="O'yin turlari bo'yicha"
              items={data.games.byType.map((x) => ({
                label: x.type === "BOMB" ? "💣 Bomba" : "⭕ X-O",
                value: x.count,
              }))}
            />
            <BreakdownCard
              title="Holatlar bo'yicha"
              items={data.games.byStatus.map((x) => ({
                label: x.status,
                value: x.count,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   TIME SERIES CHART — SVG bar chart
   ============================================================ */
function TimeSeriesChart({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ date: string; value: number }>;
  color: string;
}) {
  if (data.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--text-tertiary)",
          textAlign: "center",
        }}
      >
        {title}: ma'lumot yo'q
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const height = 100;
  const barWidth = Math.max(6, Math.floor(700 / data.length));

  return (
    <div
      style={{
        padding: 20,
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {title}
        </h3>
        <Badge variant="default">{data.length} kun</Badge>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          height,
          overflowX: "auto",
          paddingBottom: 8,
        }}
      >
        {data.map((d) => {
          const h = max > 0 ? (d.value / max) * height : 0;
          return (
            <div
              key={d.date}
              title={`${d.date}: ${d.value}`}
              style={{
                flexShrink: 0,
                width: barWidth,
                height: Math.max(2, h),
                background: color,
                borderRadius: 3,
                transition: "height 300ms var(--ease-out)",
                opacity: d.value === 0 ? 0.3 : 1,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 11,
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>{data[0]?.date ?? ""}</span>
        <span>{data[data.length - 1]?.date ?? ""}</span>
      </div>
    </div>
  );
}

/* ============================================================
   BREAKDOWN CARD
   ============================================================ */
function BreakdownCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  const total = items.reduce((s, x) => s + x.value, 0);

  return (
    <div
      style={{
        padding: 20,
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 14,
        }}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          Ma'lumot yo'q
        </span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((it) => {
            const pct = total > 0 ? (it.value / total) * 100 : 0;
            return (
              <div
                key={it.label}
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "var(--text-primary)" }}>
                    {it.label}
                  </span>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatNumber(it.value)} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--bg-subtle)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "var(--accent)",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}