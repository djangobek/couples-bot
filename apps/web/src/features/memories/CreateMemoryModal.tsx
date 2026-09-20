import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";
import type { MemoryType, MemoryVisibility } from "../../types/api";

const TYPES: { value: MemoryType; label: string; emoji: string }[] = [
  { value: "TEXT", label: "Matn", emoji: "📝" },
  { value: "PHOTO", label: "Rasm", emoji: "📸" },
  { value: "VIDEO", label: "Video", emoji: "🎬" },
  { value: "AUDIO", label: "Audio", emoji: "🎵" },
];

export function CreateMemoryModal({
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
  const [type, setType] = useState<MemoryType>("TEXT");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [visibility, setVisibility] = useState<MemoryVisibility>("COUPLE");

  function reset() {
    setType("TEXT");
    setTitle("");
    setCaption("");
    setLocation("");
    setEventAt("");
    setVisibility("COUPLE");
  }

  async function submit() {
    if (!title.trim() && !caption.trim()) {
      toast.push("Sarlavha yoki tavsif kerak", "error");
      return;
    }
    setLoading(true);
    try {
      await api.createMemory({
        type,
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
        locationName: location.trim() || undefined,
        eventAt: eventAt ? new Date(eventAt).toISOString() : undefined,
        visibility,
      });
      hapticNotify("success");
      toast.push("Xotira saqlandi ❤️", "success");
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
    <Modal open={open} onClose={onClose} title="Yangi xotira">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Type selector */}
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
                    background: active ? "var(--accent-soft)" : "var(--surface-elevated)",
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

        {/* Title */}
        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Sarlavha
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Birinchi kechki ovqat"
            maxLength={160}
            style={inputStyle}
          />
        </div>

        {/* Caption */}
        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Tafsilot
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Bugun nima bo'ldi..."
            rows={4}
            maxLength={4000}
            style={{ ...inputStyle, resize: "vertical", minHeight: 88 }}
          />
        </div>

        {/* Date + Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label
              className="eyebrow"
              style={{ display: "block", marginBottom: 8 }}
            >
              Sana
            </label>
            <input
              type="datetime-local"
              value={eventAt}
              onChange={(e) => setEventAt(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              className="eyebrow"
              style={{ display: "block", marginBottom: 8 }}
            >
              Joy
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Toshkent"
              maxLength={255}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Kim ko'radi
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { v: "COUPLE" as const, label: "Ikkimiz", emoji: "💑" },
              { v: "PRIVATE" as const, label: "Faqat men", emoji: "🔒" },
            ].map((o) => {
              const active = visibility === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setVisibility(o.v)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: "var(--radius-md)",
                    background: active ? "var(--accent-soft)" : "var(--surface-elevated)",
                    border: `1px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span>{o.emoji}</span>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={submit}
          style={{ marginTop: 4 }}
        >
          Saqlash
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
  transition: "border-color var(--dur-fast) var(--ease-out)",
};