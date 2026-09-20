/* ============================================================
   USERS PAGE — Table + filters + pagination
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { DataTable, type Column } from "../components/DataTable";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { SearchInput } from "../components/SearchInput";
import { Pagination } from "../components/Pagination";
import { EmptyState } from "../components/EmptyState";
import { timeAgo } from "../lib/format";
import type {
  AdminUserListItem,
  UserStatus,
} from "../types/admin";

const LIMIT = 25;

export function UsersPage({
  onUserClick,
}: {
  onUserClick: (id: string) => void;
}) {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "lastSeenAt" | "username">(
    "createdAt",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [cursors, setCursors] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const page = cursors.length + 1;

  const load = useCallback(
    async (nextCursor: string | undefined) => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.users({
          search: search || undefined,
          status: (statusFilter as UserStatus) || undefined,
          sortBy,
          sortDir,
          cursor: nextCursor,
          limit: LIMIT,
        });
        setUsers(data.items);
        if (data.total !== undefined) setTotal(data.total);
      } catch (err) {
        setError(humanizeError(err));
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, sortBy, sortDir],
  );

  useEffect(() => {
    setCursors([]);
    setCursor(undefined);
    void load(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sortBy, sortDir]);

  function handleNext() {
    const last = users[users.length - 1];
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

  const columns: Column<AdminUserListItem>[] = [
    {
      key: "user",
      header: "Foydalanuvchi",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={row.photoUrl} name={row.firstName} size={32} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.firstName ?? "—"}
              {row.lastName ? ` ${row.lastName}` : ""}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
              }}
            >
              {row.username ? `@${row.username}` : `ID: ${row.telegramId}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Holat",
      width: 100,
      render: (row) => (
        <Badge
          variant={
            row.status === "ACTIVE"
              ? "success"
              : row.status === "BLOCKED"
                ? "danger"
                : "default"
          }
          dot
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "games",
      header: "O'yinlar",
      align: "right",
      width: 90,
      render: (row) => (
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          {row.stats.gamesPlayed}
          {row.stats.gamesWon > 0 && (
            <span style={{ color: "var(--success)", marginLeft: 6 }}>
              ({row.stats.gamesWon}W)
            </span>
          )}
        </span>
      ),
    },
    {
      key: "couples",
      header: "Juftlik",
      align: "right",
      width: 80,
      render: (row) => (
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          {row.stats.couplesCount}
        </span>
      ),
    },
    {
      key: "lastSeen",
      header: "Oxirgi faollik",
      width: 130,
      render: (row) => (
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {timeAgo(row.lastSeenAt)}
        </span>
      ),
    },
    {
      key: "created",
      header: "Ro'yxatdan",
      width: 110,
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
            placeholder="Ism, username yoki Telegram ID…"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as UserStatus | "")
          }
          style={selectStyle}
        >
          <option value="">Barcha holatlar</option>
          <option value="ACTIVE">Faol</option>
          <option value="BLOCKED">Bloklangan</option>
          <option value="DELETED">O'chirilgan</option>
        </select>

        <select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [by, dir] = e.target.value.split(":") as [
              typeof sortBy,
              typeof sortDir,
            ];
            setSortBy(by);
            setSortDir(dir);
          }}
          style={selectStyle}
        >
          <option value="createdAt:desc">Yangi ro'yxatdan</option>
          <option value="createdAt:asc">Eski ro'yxatdan</option>
          <option value="lastSeenAt:desc">Faol (yangi)</option>
          <option value="lastSeenAt:asc">Faol (eski)</option>
          <option value="username:asc">Username (A-Z)</option>
          <option value="username:desc">Username (Z-A)</option>
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
              rows={users}
              rowKey={(u) => u.id}
              onRowClick={(u) => onUserClick(u.id)}
              loading={loading}
              emptyState={
                <EmptyState
                  icon="👥"
                  title="Foydalanuvchilar topilmadi"
                  description={
                    search
                      ? `"${search}" bo'yicha natija yo'q`
                      : "Hozircha hech kim yo'q"
                  }
                />
              }
            />
            <Pagination
              hasNext={users.length === LIMIT}
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
};