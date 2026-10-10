import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { AuthProvider } from "@/context/AuthContext";
import "@/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root no encontrado");

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);