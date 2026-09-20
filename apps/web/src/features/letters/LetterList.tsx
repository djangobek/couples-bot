import { useCallback, useEffect, useState } from "react";
import { LetterCard } from "./LetterCard";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { SkeletonCard } from "../../components/Skeleton";
import { api, humanizeError } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../hooks/useToast";
import type { LetterItem } from "../../types/api";

export function LetterList({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  const { me } = useApp();
  const toast = useToast();
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLetters(await api.listLetters());
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

  if (letters.length === 0) {
    return (
      <EmptyState
        icon={<LetterIcon />}
        title="Hali xatlar yo'q."
        description="Juftingizga maxfiy xat yozing. Hozir oching yoki maxsus kunga saqlab qo'ying."
        action={
          <Button variant="primary" size="md" onClick={onCreateClick}>
            Xat yozish
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Button variant="outline" size="md" fullWidth onClick={onCreateClick}>
        + Yangi xat
      </Button>
      {letters.map((l) => (
        <LetterCard
          key={l.id}
          letter={l}
          meId={me?.id ?? null}
          onOpen={() => toast.push("Batafsil ko'rish tez orada", "info")}
        />
      ))}
    </div>
  );
}

function LetterIcon() {
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
      <path d="M3 7l9 6 9-6" />
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  );
}