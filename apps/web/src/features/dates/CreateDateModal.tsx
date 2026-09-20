import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";

export function CreateDateModal({
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setStartsAt("");
    setLocation("");
  }

  async function submit() {
    if (!title.trim()) {
      toast.push("Sarlavha kerak", "error");
      return;
    }
    if (!startsAt) {
      toast.push("Sana va vaqt kerak", "error");
      return;
    }
    setLoading(true);
    try {
      await api.createDate({
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        location: location.trim() || undefined,
      });
      hapticNotify("success");
      toast.push("Sana saqlandi 🗓️", "success");
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
    <Modal open={open} onClose={onClose} title="Yangi sana">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Sarlavha
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yubileyimiz"
            maxLength={160}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Sana va vaqt
          </label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Joy (ixtiyoriy)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Toshkent, Chorsu"
            maxLength={255}
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
            placeholder="Nima qilishni rejalashtiryapsiz?"
            rows={3}
            maxLength={2000}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

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
};