import { useCallback, useEffect, useState } from "react";
import { MemoryCard } from "./MemoryCard";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { SkeletonCard } from "../../components/Skeleton";
import { api, humanizeError } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";
import type { MemoryItem } from "../../types/api";

export function MemoryList({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  const { me } = useApp();
  const toast = useToast();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.listMemories({ limit: 50 });
      setMemories(page.items);
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReact(memory: MemoryItem, emoji: string) {
    const myReactions = new Set(
      memory.reactions.filter((r) => r.userId === me?.id).map((r) => r.emoji),
    );
    try {
      if (myReactions.has(emoji)) {
        await api.removeReaction(memory.id, emoji);
      } else {
        await api.addReaction(memory.id, emoji);
      }
      hapticNotify("success");
      await load();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            marginBottom: 16,
          }}
        >
          {error}
        </p>
        <Button variant="secondary" size="md" onClick={load}>
          Qayta urinish
        </Button>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <EmptyState
        icon={<MemoryIcon />}
        title="Hali xotiralar yo'q."
        description="Birinchi xotirani saqlang — rasm, video, yoki bir lahzani yozib qo'ying."
        action={
          <Button variant="primary" size="md" onClick={onCreateClick}>
            + Xotira qo'shish
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Button variant="outline" size="md" fullWidth onClick={onCreateClick}>
        + Yangi xotira
      </Button>
      {memories.map((m) => (
        <MemoryCard
          key={m.id}
          memory={m}
          meId={me?.id ?? null}
          onOpen={() => toast.push("Batafsil ko'rish tez orada", "info")}
          onReact={(emoji) => handleReact(m, emoji)}
        />
      ))}
    </div>
  );
}

function MemoryIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    </svg>
  );
}