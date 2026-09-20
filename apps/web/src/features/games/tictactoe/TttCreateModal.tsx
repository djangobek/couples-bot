import { useState } from "react";
import { Button } from "../../../components/Button";
import { Modal } from "../../../components/Modal";
import { api, humanizeError } from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { hapticNotify, hapticTap } from "../../../services/telegram";
import { BOARD_CONFIG, VALID_SIZES, type ValidSize } from "./tictactoe-icons";

export function TttCreateModal({
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
  const [size, setSize] = useState<ValidSize>(3);

  async function submit() {
    setLoading(true);
    try {
      const res = await api.createTttRoom({ size });
      hapticNotify("success");
      onCreated(res.code);
      onClose();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="X-O o'yini">
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Maydon hajmini tanlang. X va O belgilari tasodifiy taqsimlanadi.
        </p>

        <div>
          <label
            className="eyebrow"
            style={{ display: "block", marginBottom: 12 }}
          >
            Maydon hajmi
          </label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {VALID_SIZES.map((s) => {
              const active = size === s;
              const cfg = BOARD_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => {
                    hapticTap("light");
                    setSize(s);
                  }}
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-lg)",
                    background: active
                      ? "linear-gradient(135deg, rgba(232,165,192,0.14), rgba(180,155,216,0.08))"
                      : "var(--surface-elevated)",
                    border: `1.5px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    textAlign: "left",
                    transition: "all 180ms ease-out",
                  }}
                >
                  {/* Preview grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${s}, 1fr)`,
                      gap: 2,
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      padding: 4,
                      borderRadius: 10,
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {Array.from({ length: s * s }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          background: active
                            ? "var(--accent-soft)"
                            : "var(--surface)",
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--fs-md)",
                        fontWeight: 700,
                        color: active ? "var(--accent)" : "var(--text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {s} × {s}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {cfg.label} · {cfg.description}
                    </div>
                  </div>

                  {active && (
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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