import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { DebugPanel } from "./components/DebugPanel";
import "./styles/globals.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

/* Show debug panel in dev mode AND in Telegram dev tunnels */
const showDebug = import.meta.env.DEV;

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
          {showDebug && <DebugPanel />}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);