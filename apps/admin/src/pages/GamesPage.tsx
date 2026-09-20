/* ============================================================
   GAMES PAGE — table + filters + pagination
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { DataTable, type Column } from "../components/DataTable";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { SearchInput } from "../components/SearchInput";
import { Pagination } from "../components/Pagination";
import { EmptyState } from "../components/EmptyState";
import { GameFilters } from "../features/games/GameFilters";
import { timeAgo } from "../lib/format";
import type {
  AdminGameListItem,
  GameType,
  GameSessionStatus,
} from "../types/admin";

const LIMIT = 25;

function statusVariant(
  status: GameSessionStatus,
): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "FINISHED":
      return "success";
    case "PLAYING":
    case "PLACING":
      return "info";
    case "WAITING":
    case "PAUSED":
      return "warning";
    case "ABANDONED":
    case "EXPIRED":
      return "danger";
    default:
      return "default";
  }
}

export function GamesPage({
  onGameClick,
}: {
  onGameClick: (id: string) => void;
}) {
  const [games, setGames] = useState<AdminGameListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState<GameType | "">("");
  const [status, setStatus] = useState<GameSessionStatus | "">("");
  const [sort, setSort] = useState("createdAt:desc");

  const [cursors, setCursors] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const page = cursors.length + 1;

  const load = useCallback(
    async (nextCursor: string | undefined) => {
      setLoading(true);
      setError(null);
      const [sortBy, sortDir] = sort.split(":") as [
        "createdAt" | "finishedAt",
        "asc" | "desc",
      ];
      try {
        const data = await adminApi.games({
          search: search || undefined,
          type: type || undefined,
          status: status || undefined,
          sortBy,
          sortDir,
          cursor: nextCursor,
          limit: LIMIT,
        });
        setGames(data.items);
        if (data.total !== undefined) setTotal(data.total);
      } catch (err) {
        setError(humanizeError(err));
      } finally {
        setLoading(false);
      }
    },
    [search, type, status, sort],
  );

  useEffect(() => {
    setCursors([]);
    setCursor(undefined);
    void load(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type, status, sort]);

  function handleNext() {
    const last = games[games.length - 1];
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

  const columns: Column<AdminGameListItem>[] = [
    {
      key: "code",
      header: "Kod",
      width: 90,
      render: (row) => (
        <span
          className="mono"
          style={{
            fontSize: 12,
            padding: "3px 8px",
            background: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
          }}
        >
          {row.code}
        </span>
      ),
    },
    {
      key: "type",
      header: "Turi",
      width: 100,
      render: (row) => (
        <span style={{ fontSize: 13 }}>
          {row.type === "BOMB" ? "💣 Bomba" : "⭕ X-O"}
        </span>
      ),
    },
    {
      key: "players",
      header: "O'yinchilar",
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {row.players.length === 0 ? (
            <span
              style={{ fontSize: 12, color: "var(--text-tertiary)" }}
            >
              —
            </span>
          ) : (
            row.players.map((p) => (
              <div
                key={p.userId}
                style={{
                  fontSize: 12,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: "var(--text-tertiary)" }}>
                  {p.symbol ?? "#"}
                </span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                  }}
                >
                  {p.firstName ?? "—"}
                </span>
                {row.winnerId === p.userId && <span>🏆</span>}
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Holat",
      width: 130,
      render: (row) => (
        <Badge variant={statusVariant(row.status)} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "size",
      header: "Maydon",
      width: 80,
      align: "center",
      render: (row) => (
        <span
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {row.size ? `${row.size}×${row.size}` : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Yaratilgan",
      width: 120,
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
            placeholder="O'yin kodi yoki ID…"
          />
        </div>

        <GameFilters
          type={type}
          onTypeChange={setType}
          status={status}
          onStatusChange={setStatus}
          sort={sort}
          onSortChange={setSort}
        />

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
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => void load(cursor)}
              >
                Qayta urinish
              </Button>
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={games}
              rowKey={(g) => g.id}
              onRowClick={(g) => onGameClick(g.id)}
              loading={loading}
              emptyState={
                <EmptyState
                  icon="🎮"
                  title="O'yinlar topilmadi"
                  description={
                    search
                      ? `"${search}" bo'yicha natija yo'q`
                      : "Hozircha o'yin yo'q"
                  }
                />
              }
            />
            <Pagination
              hasNext={games.length === LIMIT}
              hasPrev={cursors.length > 0}
              onNext={handleNext}
              onPrev={handlePrev}
              current={page}
              total={total}
            />
          </>
        )}
      </div>
    </div>
  );
}