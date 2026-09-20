import { useState } from "react";
import { Button } from "../components/Button";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";
import { api, humanizeError } from "../services/api";
import { hapticNotify } from "../services/telegram";

export function OnboardingPage() {
  const { reloadCouple } = useApp();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [anniversary, setAnniversary] = useState("");

  async function createCouple() {
    setLoading(true);
    try {
      await api.createCouple({
        displayName: name.trim() || undefined,
        anniversaryDate: anniversary || null,
      });
      hapticNotify("success");
      await reloadCouple();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 32,
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.08,
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "0.875rem",
            color: "var(--accent)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 500,
            marginBottom: 20,
          }}
        >
          ✦ Couples ✦
        </div>
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(3rem, 11vw, 4rem)",
            color: "var(--text-primary)",
            lineHeight: 1.02,
            marginBottom: 16,
          }}
        >
          Ikki kishi.
          <br />
          Bir dunyo.
        </h1>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 300,
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          Maxfiy joyingizni yarating va tayyor bo'lganda juftingizni taklif
          qiling.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          textAlign: "left",
        }}
      >
        <div>
          <label
            className="eyebrow"
            style={{ display: "block", marginBottom: 8 }}
          >
            Juftlik nomi (ixtiyoriy)
          </label>
          <input
            type="text"
            value={name}
            placeholder="Anna & Alex"
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label
            className="eyebrow"
            style={{ display: "block", marginBottom: 8 }}
          >
            Yubiley (ixtiyoriy)
          </label>
          <input
            type="date"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={createCouple}
        style={{ width: "100%", maxWidth: 360 }}
      >
        Dunyomizni yaratish
      </Button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "var(--radius-md)",
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  fontSize: "var(--fs-base)",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color var(--dur-fast) var(--ease-out)",
};