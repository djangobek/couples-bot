/* ============================================================
   SYSTEM PAGE — health + info
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { StatCard } from "../components/StatCard";
import { Skeleton } from "../components/Skeleton";
import { formatUptime, formatBytes, formatDateTime } from "../lib/format";
import type { SystemStatus } from "../types/admin";

export function SystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.system();
      setStatus(data);
      setLastChecked(new Date());
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    /* Auto-refresh every 30s */
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !status) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={120} radius="var(--radius-lg)" />
        ))}
      </div>
    );
  }

  if (error && !status) {
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
        <p style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</p>
        <Button variant="primary" size="md" onClick={load}>
          Qayta urinish
        </Button>
      </div>
    );
  }

  if (!status) return null;

  const apiStatusVariant =
    status.api.status === "ok"
      ? "success"
      : status.api.status === "degraded"
        ? "warning"
        : "danger";

  const dbStatusVariant =
    status.database.status === "ok"
      ? "success"
      : status.database.status === "degraded"
        ? "warning"
        : "danger";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          {lastChecked && `Oxirgi tekshirish: ${formatDateTime(lastChecked.toISOString())}`}
        </div>
        <Button variant="secondary" size="md" onClick={load} loading={loading}>
          🔄 Yangilash
        </Button>
      </div>

      {/* Status cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <StatusCard
          title="API"
          variant={apiStatusVariant}
          status={status.api.status}
        >
          <Row label="Uptime" value={formatUptime(status.api.uptime)} />
          <Row label="Xotira" value={formatBytes(status.api.memoryMb)} />
          <Row label="Versiya" value={status.api.version} mono />
        </StatusCard>

        <StatusCard
          title="Ma'lumotlar bazasi"
          variant={dbStatusVariant}
          status={status.database.status}
        >
          <Row
            label="Kechikish"
            value={`${status.database.latencyMs} ms`}
          />
        </StatusCard>

        <StatusCard
          title="Bot"
          variant={status.bot.status === "ok" ? "success" : "default"}
          status={status.bot.status}
        >
          <Row label="Username" value={status.bot.username ?? "—"} mono />
        </StatusCard>

        <StatusCard
          title="Muhit"
          variant={
            status.environment === "production" ? "success" : "info"
          }
          status={status.environment}
        >
          <Row label="NODE_ENV" value={status.environment} mono />
        </StatusCard>
      </div>

      {/* Health check summary */}
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
            marginBottom: 12,
            color: "var(--text-primary)",
          }}
        >
          Health Check
        </h3>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Badge variant={apiStatusVariant} dot>
            API: {status.api.status}
          </Badge>
          <Badge variant={dbStatusVariant} dot>
            DB: {status.database.status}
          </Badge>
          <Badge
            variant={status.bot.status === "ok" ? "success" : "default"}
            dot
          >
            Bot: {status.bot.status}
          </Badge>
          <Badge variant="default">
            Environment: {status.environment}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  variant,
  status,
  children,
}: {
  title: string;
  variant: "success" | "warning" | "danger" | "info" | "default";
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
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
            fontWeight: 600,
            color: "var(--text-secondary)",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        <Badge variant={variant} dot>
          {status}
        </Badge>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span
        className={mono ? "mono" : undefined}
        style={{
          color: "var(--text-primary)",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}