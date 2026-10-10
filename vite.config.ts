import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
<<<<<<< HEAD
      "@backend": path.resolve(rootDir, "../misalud-backend/src"),
=======
     // "@backend": path.resolve(rootDir, "../misalud-backend/src"),
>>>>>>> 4788b2d (fix: remover alias @backend y optimizar vite.config para Netlify)
    },
  },
  server: {
    host: false, //Adicionar redes locales y virtuales vea pues :)
    port: 5173,
    proxy: {
      "/api": {
        target: "https://misalud-backend-mwoi.onrender.com", //BackReal
        //target: "http://localhost:3000/", //Backend Prueba Localhost
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "threads",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
