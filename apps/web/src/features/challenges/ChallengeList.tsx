import { useCallback, useEffect, useState } from "react";
import { ChallengeCard } from "./ChallengeCard";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { SkeletonCard } from "../../components/Skeleton";
import { api, humanizeError } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";
import type { ChallengeItem } from "../../types/api";

export function ChallengeList({
  onCreateClick,
  onProgressClick,
}: {
  onCreateClick: () => void;
  onProgressClick: (challenge: ChallengeItem) => void;
}) {
  const { me } = useApp();
  const toast = useToast();
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setChallenges(await api.listChallenges());
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleJoin(id: string) {
    try {
      await api.joinChallenge(id);
      hapticNotify("success");
      toast.push("Challenge'ga qo'shildingiz 🎯", "success");
      await load();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    }
  }

  async function handleComplete(id: string) {
    try {
      await api.completeChallenge(id);
      hapticNotify("success");
      toast.push("Challenge tugatildi 🏆", "success");
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

  if (challenges.length === 0) {
    return (
      <EmptyState
        icon={<ChallengeIcon />}
        title="Hali challenge'lar yo'q."
        description="Juftingiz bilan bellashing. O'qish, ketma-ketlik, sahifalar — o'zingiz tanlang."
        action={
          <Button variant="primary" size="md" onClick={onCreateClick}>
            + Challenge boshlash
          </Button>
        }
      />
    );
  }

  const active = challenges.filter((c) => c.status === "ACTIVE");
  const completed = challenges.filter((c) => c.status === "COMPLETED");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Button variant="outline" size="md" fullWidth onClick={onCreateClick}>
        + Yangi challenge
      </Button>

      {active.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 className="eyebrow">Faol</h3>
          {active.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              meId={me?.id ?? null}
              onJoin={() => handleJoin(c.id)}
              onProgress={() => onProgressClick(c)}
              onComplete={() => handleComplete(c.id)}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 className="eyebrow">Tugatilgan</h3>
          {completed.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              meId={me?.id ?? null}
              onJoin={() => handleJoin(c.id)}
              onProgress={() => onProgressClick(c)}
              onComplete={() => handleComplete(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}