import { useState } from "react";
import { Button } from "../../../components/Button";
import { Modal } from "../../../components/Modal";
import { api, humanizeError } from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { hapticNotify } from "../../../services/telegram";
import { bombCountForSize } from "./bomb-utils";

const SIZES = [5, 6, 7, 8, 9, 10];

export function BombCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (code: string) => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState(6);
  const [reward, setReward] = useState("");

  async function submit() {
    if (!reward.trim()) {
      toast.push("Sovg'a yoki maqsad yozing", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createBombRoom({
        size,
        reward: reward.trim(),
      });
      hapticNotify("success");
      onCreated(res.code);
      setReward("");
      onClose();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bomba o'yini">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Raqibingizning yashirin bombalarini birinchi bo'lib toping. Kim
          yutadi — sovg'ani oladi.
        </p>

        <div>
          <label
            className="eyebrow"
            style={{ display: "block", marginBottom: 10 }}
          >
            Maydon o'lchami
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SIZES.map((s) => {
              const active = size === s;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  style={{
                    flex: "1 0 auto",
                    minWidth: 60,
                    padding: "10px 8px",
                    borderRadius: "var(--radius-md)",
                    background: active
                      ? "var(--accent-soft)"
                      : "var(--surface-elevated)",
                    border: `1px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "var(--fs-md)" }}>
                    {s}×{s}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 2,
                      opacity: 0.7,
                    }}
                  >
                    {bombCountForSize(s)} 💣
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            className="eyebrow"
            style={{ display: "block", marginBottom: 8 }}
          >
            Sovg'a / Maqsad
          </label>
          <input
            type="text"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Yutgan Tailandga sayohat qiladi"
            maxLength={200}
            style={inputStyle}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={submit}
        >
          O'yin yaratish
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