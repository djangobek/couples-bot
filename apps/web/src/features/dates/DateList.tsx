import { useCallback, useEffect, useState } from "react";
import { DateCard } from "./DateCard";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { SkeletonCard } from "../../components/Skeleton";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";
import type { DateItem } from "../../types/api";

export function DateList({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  const toast = useToast();
  const [dates, setDates] = useState<DateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDates(await api.listDates());
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    try {
      await api.deleteDate(id);
      hapticNotify("success");
      toast.push("Sana o'chirildi", "success");
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

  if (dates.length === 0) {
    return (
      <EmptyState
        icon={<DateIcon />}
        title="Hali sanalar yo'q."
        description="Birinchi uchrashuv, tug'ilgan kun, yubiley, sayohat — muhim kunlarni belgilang."
        action={
          <Button variant="primary" size="md" onClick={onCreateClick}>
            + Sana qo'shish
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Button variant="outline" size="md" fullWidth onClick={onCreateClick}>
        + Yangi sana
      </Button>
      {dates.map((d) => (
        <DateCard
          key={d.id}
          date={d}
          onDelete={() => handleDelete(d.id)}
        />
      ))}
    </div>
  );
}

function DateIcon() {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}