import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";

export function CreateLetterModal({
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
  const [body, setBody] = useState("");
  const [sendNow, setSendNow] = useState(true);

  function reset() {
    setTitle("");
    setBody("");
    setSendNow(true);
  }

  async function submit() {
    if (!body.trim()) {
      toast.push("Xat matni bo'sh bo'lmasligi kerak", "error");
      return;
    }
    setLoading(true);
    try {
      await api.createLetter({
        title: title.trim() || undefined,
        body: body.trim(),
        sendNow,
      });
      hapticNotify("success");
      toast.push(sendNow ? "Xat yuborildi 💌" : "Qoralama saqlandi", "success");
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
    <Modal open={open} onClose={onClose} title="Yangi xat">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Sarlavha (ixtiyoriy)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yubileyimizga"
            maxLength={160}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Xat
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Sevgilim..."
            rows={10}
            maxLength={20000}
            style={{ ...inputStyle, resize: "vertical", minHeight: 200, lineHeight: 1.6 }}
          />
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-tertiary)",
              marginTop: 6,
              textAlign: "right",
            }}
          >
            {body.length} / 20000
          </div>
        </div>

        {/* Send now toggle */}
        <button
          onClick={() => setSendNow(!sendNow)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            borderRadius: "var(--radius-md)",
            background: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontSize: "var(--fs-sm)",
            fontWeight: 500,
          }}
        >
          <span>Hozir yuborish</span>
          <span
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              background: sendNow ? "var(--accent)" : "var(--border-strong)",
              position: "relative",
              transition: "background var(--dur-base) var(--ease-out)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: sendNow ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                transition: "left var(--dur-base) var(--ease-spring)",
              }}
            />
          </span>
        </button>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={submit}
          style={{ marginTop: 4 }}
        >
          {sendNow ? "Yuborish" : "Saqlash"}
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