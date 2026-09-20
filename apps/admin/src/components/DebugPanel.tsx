/* ============================================================
   DEBUG PANEL — Admin
   Shows detailed API diagnostics
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { getInitData, getTelegramUser, tg } from "../lib/telegram";

type CheckResult = {
  label: string;
  status: "ok" | "error" | "warn" | "info";
  detail: string;
  raw?: unknown;
};

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const out: CheckResult[] = [];

    /* ---------- 1. Telegram env ---------- */
    const initData = getInitData();
    const user = getTelegramUser();

    out.push({
      label: "1. Telegram SDK",
      status: tg ? "ok" : "error",
      detail: tg ? `Platform: ${tg.platform}, v${tg.version}` : "Telegram.WebApp topilmadi",
    });

    out.push({
      label: "2. initData",
      status: initData ? "ok" : "error",
      detail: initData
        ? `${initData.length} belgi`
        : "initData BO'SH — Mini App Telegram'dan tashqarida ochilgan",
    });

    out.push({
      label: "3. Telegram user",
      status: user ? "ok" : "warn",
      detail: user
        ? `ID: ${user.id}, Name: ${user.first_name ?? "?"}`
        : "User ma'lumoti yo'q",
      raw: user,
    });

    /* ---------- 2. API URL ---------- */
    const apiUrl =
      (import.meta.env.VITE_API_URL as string | undefined) ?? "";
    out.push({
      label: "4. VITE_API_URL",
      status: apiUrl ? "ok" : "error",
      detail: apiUrl || "SOZLANMAGAN — .env da VITE_API_URL yo'q",
    });

    /* ---------- 3. Test /health ---------- */
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/health`, {
          method: "GET",
        });
        const text = await res.text();
        out.push({
          label: "5. GET /health",
          status: res.ok ? "ok" : "error",
          detail: `${res.status} ${res.statusText}`,
          raw: text.slice(0, 300),
        });
      } catch (err) {
        out.push({
          label: "5. GET /health",
          status: "error",
          detail: `Tarmoq xatosi: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    /* ---------- 4. Test /v1/auth/me ---------- */
    if (apiUrl && initData) {
      try {
        const res = await fetch(`${apiUrl}/v1/auth/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Telegram-Init-Data": initData,
          },
        });
        const text = await res.text();
        let parsed: unknown = text;
        try {
          parsed = JSON.parse(text);
        } catch {
          /* ignore */
        }
        out.push({
          label: "6. GET /v1/auth/me",
          status: res.ok ? "ok" : "error",
          detail: `${res.status} ${res.statusText}`,
          raw: parsed,
        });
      } catch (err) {
        out.push({
          label: "6. GET /v1/auth/me",
          status: "error",
          detail: `Tarmoq xatosi: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    } else {
      out.push({
        label: "6. GET /v1/auth/me",
        status: "warn",
        detail: !apiUrl ? "API URL yo'q" : "initData yo'q",
      });
    }

    /* ---------- 5. Test /v1/admin/dashboard ---------- */
    if (apiUrl && initData) {
      try {
        const res = await fetch(`${apiUrl}/v1/admin/dashboard`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Telegram-Init-Data": initData,
          },
        });
        const text = await res.text();
        let parsed: unknown = text;
        try {
          parsed = JSON.parse(text);
        } catch {
          /* ignore */
        }
        out.push({
          label: "7. GET /v1/admin/dashboard",
          status: res.ok ? "ok" : "error",
          detail: `${res.status} ${res.statusText}`,
          raw: parsed,
        });
      } catch (err) {
        out.push({
          label: "7. GET /v1/admin/dashboard",
          status: "error",
          detail: `Tarmoq xatosi: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    } else {
      out.push({
        label: "7. GET /v1/admin/dashboard",
        status: "warn",
        detail: "O'tkazib yuborildi (initData yoki URL yo'q)",
      });
    }

    /* ---------- 6. Current URL ---------- */
    out.push({
      label: "8. Current location",
      status: "info",
      detail: window.location.href,
    });

    /* ---------- 7. NODE_ENV ---------- */
    out.push({
      label: "9. import.meta.env.DEV",
      status: "info",
      detail: String(import.meta.env.DEV),
    });

    /* ---------- 8. Admin Web URL ---------- */
    out.push({
      label: "10. Admin origin",
      status: "info",
      detail: window.location.origin,
    });

    setResults(out);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (open) void runChecks();
  }, [open, runChecks]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Debug panel"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: open ? "var(--danger)" : "var(--surface-elevated)",
          border: "1px solid var(--border-strong)",
          color: open ? "#fff" : "var(--text-primary)",
          fontSize: 20,
          cursor: "pointer",
          zIndex: 999,
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        {open ? "✕" : "🐞"}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            padding: 20,
            overflowY: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              background: "#0a0a0d",
              border: "1px solid #2a2a36",
              borderRadius: 12,
              padding: 20,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                🐞 Admin Debug Panel
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={runChecks}
                  disabled={running}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "#1a1a22",
                    border: "1px solid #2a2a36",
                    color: "#fff",
                    fontSize: 11,
                    cursor: running ? "wait" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {running ? "Tekshirilmoqda…" : "🔄 Qayta tekshirish"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "#1a1a22",
                    border: "1px solid #2a2a36",
                    color: "#fff",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Yopish
                </button>
              </div>
            </div>

            {/* Results */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "#14141a",
                    borderLeft: `3px solid ${statusColor(r.status)}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {statusEmoji(r.status)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#e0e0e5",
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#a0a0b0",
                      wordBreak: "break-all",
                      lineHeight: 1.5,
                    }}
                  >
                    {r.detail}
                  </div>
                  {r.raw !== undefined && (
                    <pre
                      style={{
                        marginTop: 8,
                        padding: 8,
                        borderRadius: 4,
                        background: "#0a0a0d",
                        border: "1px solid #2a2a36",
                        fontSize: 10,
                        color: "#a0a0b0",
                        overflow: "auto",
                        maxHeight: 200,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {typeof r.raw === "string"
                        ? r.raw
                        : JSON.stringify(r.raw, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 8,
                background: "#14141a",
                border: "1px solid #2a2a36",
                fontSize: 11,
                color: "#a0a0b0",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#e0e0e5" }}>💡 Nima qilish kerak:</strong>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <strong>initData BO'SH</strong> → Telegram Mini App orqali
                  ochish kerak (brauzerda emas)
                </li>
                <li>
                  <strong>VITE_API_URL yo'q</strong> →{" "}
                  <code style={{ color: "#818cf8" }}>apps/admin/.env</code>{" "}
                  yaratish kerak
                </li>
                <li>
                  <strong>GET /health 404</strong> → Backend URL noto'g'ri
                </li>
                <li>
                  <strong>GET /v1/admin/dashboard 403</strong> → Telegram ID
                  admin ro'yxatida yo'q
                </li>
                <li>
                  <strong>GET /v1/admin/dashboard 404</strong> → Backend'da
                  route yo'q — backend qayta build qilish kerak
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function statusColor(status: CheckResult["status"]): string {
  switch (status) {
    case "ok":
      return "#10b981";
    case "error":
      return "#ef4444";
    case "warn":
      return "#f59e0b";
    default:
      return "#6366f1";
  }
}

function statusEmoji(status: CheckResult["status"]): string {
  switch (status) {
    case "ok":
      return "✅";
    case "error":
      return "❌";
    case "warn":
      return "⚠️";
    default:
      return "ℹ️";
  }
}