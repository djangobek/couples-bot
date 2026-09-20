/* ============================================================
   DASHBOARD PAGE
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { StatCard } from "../components/StatCard";
import { Skeleton } from "../components/Skeleton";
import { Badge } from "../components/Badge";
import { ActivityFeed } from "../features/dashboard/ActivityFeed";
import { GamesByTypeBar } from "../features/dashboard/GamesByTypeBar";
import { formatUptime, formatNumber } from "../lib/format";
import type { DashboardStats } from "../types/admin";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminApi.dashboard());
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={110} radius="var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p style={{ color: "var(--danger)", marginBottom: 16 }}>
          {error ?? "Ma'lumot yuklanmadi"}
        </p>
        <button onClick={load} style={btnStyle}>
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ============ USERS SECTION ============ */}
      <section>
        <h2 style={sectionTitle}>Foydalanuvchilar</h2>
        <div style={gridStyle}>
          <StatCard
            label="Jami"
            value={formatNumber(stats.users.total)}
            icon="👥"
            hint={`Bugun: +${stats.users.newToday}`}
            trend={stats.users.newToday > 0 ? "up" : "flat"}
            trendValue={`+${stats.users.newToday}`}
          />
          <StatCard
            label="Faol (7 kun)"
            value={formatNumber(stats.users.active)}
            icon="⚡"
            trend="up"
            trendValue={`${Math.round((stats.users.active / Math.max(stats.users.total, 1)) * 100)}%`}
          />
          <StatCard
            label="Online (5 daq)"
            value={formatNumber(stats.users.online)}
            icon="🟢"
            hint="Hozir tizimda"
          />
          <StatCard
            label="Bloklangan"
            value={formatNumber(stats.users.blocked)}
            icon="🚫"
            trend={stats.users.blocked > 0 ? "down" : "flat"}
          />
        </div>
      </section>

      {/* ============ GAMES SECTION ============ */}
      <section>
        <h2 style={sectionTitle}>O'yinlar</h2>
        <div style={gridStyle}>
          <StatCard
            label="Jami"
            value={formatNumber(stats.games.total)}
            icon="🎮"
            hint={`Bugun: ${stats.games.todayCount}`}
            trend={stats.games.todayCount > 0 ? "up" : "flat"}
          />
          <StatCard
            label="Faol"
            value={formatNumber(stats.games.active)}
            icon="⏳"
            hint="Hozir o'ynalmoqda"
          />
          <StatCard
            label="Tugagan"
            value={formatNumber(stats.games.finished)}
            icon="✅"
            hint={`G'alabali: ${stats.games.finished - stats.games.draws}`}
          />
          <StatCard
            label="Durang"
            value={formatNumber(stats.games.draws)}
            icon="🤝"
          />
        </div>
      </section>

      {/* ============ GAMES BY TYPE + ACTIVITY ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1.5fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div>
          <h2 style={sectionTitle}>O'yin turlari</h2>
          <GamesByTypeBar byType={stats.games.byType} />
        </div>
        <div>
          <h2 style={sectionTitle}>So'nggi faoliyat</h2>
          <ActivityFeed />
        </div>
      </div>

      {/* ============ SYSTEM ============ */}
      <section>
        <h2 style={sectionTitle}>Tizim</h2>
        <div
          style={{
            padding: 20,
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          <InfoBlock
            label="Muhit"
            value={
              <Badge
                variant={
                  stats.system.environment === "production"
                    ? "success"
                    : "info"
                }
              >
                {stats.system.environment}
              </Badge>
            }
          />
          <InfoBlock
            label="Node"
            value={<span className="mono">{stats.system.nodeVersion}</span>}
          />
          <InfoBlock
            label="Uptime"
            value={formatUptime(stats.system.uptime)}
          />
          <InfoBlock
            label="Juftliklar"
            value={`${formatNumber(stats.couples.total)} (${formatNumber(stats.couples.active)} faol)`}
          />
        </div>
      </section>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: 12,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 12,
};

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "var(--radius-md)",
  background: "var(--accent)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};