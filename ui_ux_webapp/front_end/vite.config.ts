// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,

    // 👇––– AQUÍ VA EL PROXY –––👇
    proxy: {
      "/api": "http://127.0.0.1:8000"
      // si tu backend corre en otro host/puerto, cámbialo
    }
  },

  plugins: [
    react(), // único plugin
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
