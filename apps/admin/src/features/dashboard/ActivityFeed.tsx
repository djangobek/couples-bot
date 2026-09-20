/* ============================================================
   ACTIVITY FEED — Dashboard
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../../lib/api";
import { Avatar } from "../../components/Avatar";
import { Skeleton } from "../../components/Skeleton";
import { timeAgo } from "../../lib/format";
import type { DashboardActivityItem } from "../../types/admin";

function activityText(item: DashboardActivityItem): {
  emoji: string;
  text: string;
} {
  const who = item.actorName ?? "Kimdir";
  switch (item.type) {
    case "MEMORY_ADDED":
      return { emoji: "📸", text: `${who} xotira qo'shdi` };
    case "MEMORY_REACTED":
      return { emoji: "💫", text: `${who} reaksiya qoldirdi` };
    case "LETTER_SENT":
      return { emoji: "💌", text: `${who} xat yubordi` };
    case "BOOK_ADDED":
      return { emoji: "📚", text: `${who} kitob qo'shdi` };
    case "READING_PROGRESS":
      return { emoji: "📖", text: `${who} o'qishni davom ettirdi` };
    case "CHALLENGE_CREATED":
      return { emoji: "🎯", text: `${who} challenge boshladi` };
    case "CHALLENGE_COMPLETED":
      return { emoji: "🏆", text: `${who} challengeni tugatdi` };
    case "DATE_CREATED":
      return { emoji: "🗓️", text: `${who} uchrashuv qo'shdi` };
    case "PARTNER_JOINED":
      return { emoji: "💞", text: `${who} juftlikka qo'shildi` };
    case "PARTNER_LEFT":
      return { emoji: "👋", text: `${who} juftlikdan chiqdi` };
    default:
      return { emoji: "•", text: `${who} — ${item.type}` };
  }
}

export function ActivityFeed() {
  const [items, setItems] = useState<DashboardActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.dashboardActivity({ limit: 15 });
      setItems(data.items);
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
      <div
        style={{
          padding: 16,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Skeleton width={32} height={32} radius="50%" />
            <Skeleton height={14} width="70%" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          textAlign: "center",
          fontSize: 13,
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
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px dashed var(--border-strong)",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-tertiary)",
        }}
      >
        Hali faoliyat yo'q
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {items.map((item) => {
        const { emoji, text } = activityText(item);
        return (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 8px",
              borderRadius: "var(--radius-sm)",
              transition: "background 140ms var(--ease-out)",
            }}
          >
            {item.actorPhotoUrl !== null ? (
              <Avatar
                src={item.actorPhotoUrl}
                name={item.actorName}
                size={28}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {emoji}
              </div>
            )}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                flexShrink: 0,
              }}
            >
              {timeAgo(item.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}