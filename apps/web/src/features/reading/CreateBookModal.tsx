import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";

export function CreateBookModal({
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
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [pageCount, setPageCount] = useState("");

  function reset() {
    setTitle("");
    setAuthor("");
    setDescription("");
    setPageCount("");
  }

  async function submit() {
    if (!title.trim()) {
      toast.push("Kitob nomi kerak", "error");
      return;
    }
    setLoading(true);
    try {
      await api.createBook({
        title: title.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
      });
      hapticNotify("success");
      toast.push("Kitob qo'shildi 📚", "success");
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
    <Modal open={open} onClose={onClose} title="Yangi kitob">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Kitob nomi
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Atomic Habits"
            maxLength={200}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Muallif
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="James Clear"
            maxLength={160}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Bet soni (ixtiyoriy)
          </label>
          <input
            type="number"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
            placeholder="320"
            min="1"
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
          Qo'shish
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