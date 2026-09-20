/* ============================================================
   LOGS PAGE — audit trail
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { DataTable, type Column } from "../components/DataTable";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { SearchInput } from "../components/SearchInput";
import { Pagination } from "../components/Pagination";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { timeAgo, formatDateTime, shortId } from "../lib/format";
import type { AdminLogItem } from "../types/admin";

const LIMIT = 40;

function actionVariant(
  action: string,
): "success" | "danger" | "info" | "warning" | "default" {
  if (action.includes("BLOCK")) return "danger";
  if (action.includes("UNBLOCK")) return "success";
  if (action.includes("DELETE")) return "danger";
  if (action.includes("ABANDON")) return "warning";
  if (action.includes("CREATE") || action.includes("ADD")) return "info";
  return "default";
}

export function LogsPage() {
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);

  const [cursors, setCursors] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<AdminLogItem | null>(null);
  const page = cursors.length + 1;

  const load = useCallback(
    async (nextCursor: string | undefined) => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.logs({
          search: search || undefined,
          action: action || undefined,
          entity: entity || undefined,
          cursor: nextCursor,
          limit: LIMIT,
        });
        setLogs(data.items);
        if (data.total !== undefined) setTotal(data.total);
      } catch (err) {
        setError(humanizeError(err));
      } finally {
        setLoading(false);
      }
    },
    [search, action, entity],
  );

  useEffect(() => {
    setCursors([]);
    setCursor(undefined);
    void load(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, action, entity]);

  /* Load filter options once */
  useEffect(() => {
    (async () => {
      try {
        const [a, e] = await Promise.all([
          adminApi.logActions(),
          adminApi.logEntities(),
        ]);
        setActions(a);
        setEntities(e);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  function handleNext() {
    const last = logs[logs.length - 1];
    if (!last) return;
    setCursors((prev) => [...prev, cursor ?? ""]);
    setCursor(last.id);
    void load(last.id);
  }

  function handlePrev() {
    const newCursors = [...cursors];
    newCursors.pop();
    setCursors(newCursors);
    const prevCursor = newCursors[newCursors.length - 1] || undefined;
    setCursor(prevCursor);
    void load(prevCursor);
  }

  const columns: Column<AdminLogItem>[] = [
    {
      key: "action",
      header: "Action",
      width: 180,
      render: (row) => (
        <Badge variant={actionVariant(row.action)}>{row.action}</Badge>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      width: 130,
      render: (row) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {row.entity}
        </span>
      ),
    },
    {
      key: "entityId",
      header: "Entity ID",
      width: 100,
      render: (row) =>
        row.entityId ? (
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--text-tertiary)" }}
          >
            {shortId(row.entityId)}
          </span>
        ) : (
          <span style={{ color: "var(--text-tertiary)" }}>—</span>
        ),
    },
    {
      key: "actor",
      header: "Kim",
      render: (row) => (
        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
          {row.actorName ?? (
            <span className="mono" style={{ fontSize: 11 }}>
              {row.actorId ? shortId(row.actorId) : "System"}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Vaqt",
      width: 130,
      render: (row) => (
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {timeAgo(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: 200 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Action yoki entity…"
          />
        </div>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={selectStyle}
        >
          <option value="">Barcha actionlar</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          style={selectStyle}
        >
          <option value="">Barcha entitylar</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>

        <Button
          variant="secondary"
          size="md"
          onClick={() => void load(cursor)}
        >
          🔄 Yangilash
        </Button>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {error ? (
          <EmptyState
            icon="⚠"
            title="Yuklashda xatolik"
            description={error}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={logs}
              rowKey={(l) => l.id}
              onRowClick={(l) => setSelected(l)}
              loading={loading}
              emptyState={
                <EmptyState
                  icon="📋"
                  title="Loglar topilmadi"
                  description="Filtrni o'zgartiring yoki keyinroq urinib ko'ring"
                />
              }
            />
            <Pagination
              hasNext={logs.length === LIMIT}
              hasPrev={cursors.length > 0}
              onNext={handleNext}
              onPrev={handlePrev}
              current={page}
              total={total}
            />
          </>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Log tafsiloti"
        maxWidth={600}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Row label="Action" value={selected.action} mono />
            <Row label="Entity" value={selected.entity} mono />
            {selected.entityId && (
              <Row label="Entity ID" value={selected.entityId} mono />
            )}
            {selected.actorId && (
              <Row
                label="Actor"
                value={selected.actorName ?? selected.actorId}
                mono
              />
            )}
            {selected.coupleId && (
              <Row label="Couple ID" value={selected.coupleId} mono />
            )}
            <Row
              label="Vaqt"
              value={formatDateTime(selected.createdAt)}
            />
            {selected.metadata !== null && selected.metadata !== undefined && (
              <div>
                <div style={labelStyle}>Metadata</div>
                <pre
                  style={{
                    padding: 12,
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-secondary)",
                    overflow: "auto",
                    maxHeight: 240,
                  }}
                >
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
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
    <div>
      <div style={labelStyle}>{label}</div>
      <div
        className={mono ? "mono" : undefined}
        style={{
          fontSize: 13,
          color: "var(--text-primary)",
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 600,
  marginBottom: 4,
};

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
  outline: "none",
  maxWidth: 220,
};