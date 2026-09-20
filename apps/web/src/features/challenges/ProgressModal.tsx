import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";
import { useApp } from "../../context/AppContext";
import type { ChallengeItem } from "../../types/api";

export function ChallengeProgressModal({
  challenge,
  open,
  onClose,
  onSaved,
}: {
  challenge: ChallengeItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { me } = useApp();
  const toast = useToast();

  const myProgress = challenge?.participants.find((p) => p.userId === me?.id);
  const [score, setScore] = useState(
    myProgress ? String(myProgress.score) : "0",
  );
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!challenge) return;
    const value = parseInt(score, 10);
    if (isNaN(value) || value < 0) {
      toast.push("Ball noto'g'ri", "error");
      return;
    }
    setLoading(true);
    try {
      await api.updateChallengeProgress(challenge.id, { score: value });
      hapticNotify("success");
      toast.push("Ball saqlandi 🎯", "success");
      onSaved();
      onClose();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  if (!challenge) return null;

  return (
    <Modal open={open} onClose={onClose} title={challenge.title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Yangi ballingizni kiriting
        </p>

        <div>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            min="0"
            style={{
              ...inputStyle,
              fontSize: 32,
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              padding: "20px 14px",
            }}
          />
          {challenge.targetValue && (
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-tertiary)",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Maqsad: {challenge.targetValue}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            Bekor
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            onClick={submit}
          >
            Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "var(--radius-md)",
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};