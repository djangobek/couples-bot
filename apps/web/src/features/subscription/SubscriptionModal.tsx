/* ============================================================
   SubscriptionModal — fallback dialog
   Used when a user tries to access a protected route without sub
   ============================================================ */

import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import type { SubscriptionStatus } from "./subscription-types";
import { openExternal } from "../../services/telegram";

export function SubscriptionModal({
  open,
  status,
  checking,
  onClose,
  onCheck,
}: {
  open: boolean;
  status: SubscriptionStatus | null;
  checking: boolean;
  onClose: () => void;
  onCheck: () => void;
}) {
  const missing = status?.channels.filter((c) => !c.isMember) ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Majburiy obuna">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          Ilovadan foydalanish uchun quyidagi kanallarga obuna bo'ling:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {missing.map((ch) => (
            <button
              key={ch.id}
              onClick={() => ch.link && openExternal(ch.link)}
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <span>➕ {ch.label}</span>
              <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                →
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={checking}
          onClick={onCheck}
        >
          ✅ Tekshirish
        </Button>
      </div>
    </Modal>
  );
}