import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { ToastProvider } from "./hooks/useToast";
import { ToastHost } from "./components/Toast";
import { NetworkBanner } from "./components/NetworkBanner";
import { DebugPanel } from "./app/DebugPanel";
import "./styles/globals.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

const isDev = import.meta.env.DEV;

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppProvider>
            <NetworkBanner />
            <App />
            <ToastHost />
            {isDev && <DebugPanel />}
          </AppProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);