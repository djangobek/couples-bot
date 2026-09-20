import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";
import type { ChallengeType } from "../../types/api";

const TYPES: { value: ChallengeType; label: string; emoji: string }[] = [
  { value: "CUSTOM", label: "Maxsus", emoji: "🎯" },
  { value: "READING_RACE", label: "O'qish poygasi", emoji: "📚" },
  { value: "STREAK", label: "Ketma-ketlik", emoji: "🔥" },
  { value: "PAGES", label: "Sahifalar", emoji: "📄" },
];

export function CreateChallengeModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<ChallengeType>("CUSTOM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");

  function reset() {
    setType("CUSTOM");
    setTitle("");
    setDescription("");
    setTargetValue("");
  }

  async function submit() {
    if (!title.trim()) {
      toast.push("Sarlavha kerak", "error");
      return;
    }
    setLoading(true);
    try {
      await api.createChallenge({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        targetValue: targetValue ? parseInt(targetValue, 10) : null,
      });
      hapticNotify("success");
      toast.push("Challenge boshlandi 🎯", "success");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Yangi challenge">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Turi
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TYPES.map((t) => {
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-full)",
                    background: active
                      ? "var(--accent-soft)"
                      : "var(--surface-elevated)",
                    border: `1px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Sarlavha
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="7 kunda 100 sahifa"
            maxLength={160}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Tafsilot (ixtiyoriy)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kim birinchi tugatadi?"
            rows={3}
            maxLength={2000}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Maqsad (ixtiyoriy)
          </label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="100"
            min="1"
            style={inputStyle}
          />
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-tertiary)",
              marginTop: 6,
            }}
          >
            Yutish uchun kerakli ball
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={submit}
          style={{ marginTop: 4 }}
        >
          Boshlash
        </Button>
      </div>
    </Modal>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-md)",
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  fontSize: "var(--fs-base)",
  outline: "none",
  fontFamily: "inherit",
};