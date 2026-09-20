import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".trycloudflare.com",
      ".ngrok-free.app",
      ".ngrok.io",
      ".loca.lt",
    ],
    cors: true,
  },
  preview: {
    port: 5173,
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".trycloudflare.com",
      ".ngrok-free.app",
      ".ngrok.io",
      ".loca.lt",
    ],
  },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
  esbuild: {
    legalComments: "none",
  },
});