/* ============================================================
   USER DETAIL PAGE
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { LoadingScreen } from "../components/LoadingScreen";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { formatDate, timeAgo, formatDateTime } from "../lib/format";
import type { AdminUserDetail } from "../types/admin";

export function UserDetailPage({
  userId,
  onBack,
}: {
  userId: string;
  onBack: () => void;
}) {
  const toast = useToast();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.user(userId);
      setUser(data);
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleBlock() {
    if (!user) return;
    setBusy(true);
    try {
      if (user.status === "BLOCKED") {
        await adminApi.unblockUser(user.id);
        toast.push("Foydalanuvchi blokdan chiqarildi", "success");
      } else {
        await adminApi.blockUser(user.id);
        toast.push("Foydalanuvchi bloklandi", "success");
      }
      setConfirmOpen(false);
      await load();
    } catch (err) {
      toast.push(humanizeError(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="Foydalanuvchi yuklanmoqda…" />;
  }

  if (error || !user) {
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
          {error ?? "Foydalanuvchi topilmadi"}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button variant="secondary" size="md" onClick={onBack}>
            ← Orqaga
          </Button>
          <Button variant="primary" size="md" onClick={load}>
            Qayta urinish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          alignSelf: "flex-start",
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        ← Foydalanuvchilarga qaytish
      </button>

      {/* Profile header */}
      <div
        style={{
          padding: 24,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          gap: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Avatar src={user.photoUrl} name={user.firstName} size={72} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>
              {user.firstName ?? "—"}
              {user.lastName ? ` ${user.lastName}` : ""}
            </h1>
            <Badge
              variant={
                user.status === "ACTIVE"
                  ? "success"
                  : user.status === "BLOCKED"
                    ? "danger"
                    : "default"
              }
              dot
            >
              {user.status}
            </Badge>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 13,
              color: "var(--text-secondary)",
              flexWrap: "wrap",
            }}
          >
            {user.username && <span>@{user.username}</span>}
            <span className="mono">TG: {user.telegramId}</span>
            {user.languageCode && <span>🌐 {user.languageCode}</span>}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginTop: 8,
            }}
          >
            Ro'yxatdan: {formatDate(user.createdAt)}
            {user.lastSeenAt && ` · Oxirgi faollik: ${timeAgo(user.lastSeenAt)}`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            variant={user.status === "BLOCKED" ? "primary" : "danger"}
            size="md"
            onClick={() => setConfirmOpen(true)}
          >
            {user.status === "BLOCKED"
              ? "🔓 Blokdan chiqarish"
              : "🚫 Bloklash"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <StatCard
          label="O'yinlar"
          value={user.stats.gamesPlayed}
          icon="🎮"
        />
        <StatCard
          label="G'alabalar"
          value={user.stats.gamesWon}
          icon="🏆"
        />
        <StatCard
          label="Juftliklar"
          value={user.stats.couplesCount}
          icon="💑"
        />
        <StatCard
          label="Xotiralar"
          value={user.stats.memoriesCount}
          icon="📸"
        />
      </div>

      {/* Two columns: games + activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* Recent games */}
        <section>
          <h2 style={sectionTitle}>So'nggi o'yinlar</h2>
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {user.recentGames.length === 0 ? (
              <EmptyState icon="🎮" title="O'yinlar yo'q" />
            ) : (
              user.recentGames.map((g, i) => (
                <div
                  key={g.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom:
                      i < user.recentGames.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>
                      {g.type === "BOMB" ? "💣" : "⭕"}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {g.type === "BOMB" ? "Bomba" : "X-O"}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {formatDateTime(g.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Badge
                      variant={
                        g.status === "FINISHED"
                          ? g.winnerId === user.id
                            ? "success"
                            : "default"
                          : g.status === "ABANDONED"
                            ? "danger"
                            : "info"
                      }
                    >
                      {g.status === "FINISHED" && g.winnerId === user.id
                        ? "🏆 Yutdi"
                        : g.status === "FINISHED" && g.winnerId === null
                          ? "🤝 Durang"
                          : g.status === "FINISHED"
                            ? "Yutqazdi"
                            : g.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <h2 style={sectionTitle}>So'nggi faoliyat</h2>
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {user.recentActivity.length === 0 ? (
              <EmptyState icon="📋" title="Faoliyat yo'q" />
            ) : (
              user.recentActivity.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    padding: "10px 16px",
                    borderBottom:
                      i < user.recentActivity.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.type}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      flexShrink: 0,
                    }}
                  >
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Confirm block modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={
          user.status === "BLOCKED"
            ? "Blokdan chiqarish?"
            : "Bloklash?"
        }
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {user.status === "BLOCKED"
            ? `${user.firstName ?? "Bu foydalanuvchi"} yana tizimga kira oladi.`
            : `${user.firstName ?? "Bu foydalanuvchi"} endi tizimga kira olmaydi.`}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setConfirmOpen(false)}
          >
            Bekor qilish
          </Button>
          <Button
            variant={user.status === "BLOCKED" ? "primary" : "danger"}
            size="md"
            loading={busy}
            onClick={toggleBlock}
          >
            {user.status === "BLOCKED" ? "Blokdan chiqarish" : "Bloklash"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: 10,
};