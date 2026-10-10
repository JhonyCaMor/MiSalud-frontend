import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { App } from "@/App";
import { VENDEDOR, mockFetch } from "@/test/helpers";

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("muestra error cuando las credenciales son incorrectas (401)", async () => {
    const fn = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        void init;
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Credenciales incorrectas" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      throw new Error(`No hay mock para: ${url}`);
    }) as typeof fetch;
    globalThis.fetch = fn;

    render(<AuthProvider><App /></AuthProvider>);

    fireEvent.change(screen.getByPlaceholderText("usuario@misalud.com"), {
      target: { value: "vendedor.cali@misalud.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "mala-clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });
  });

  it("ingresa como vendedor y redirige al punto de venta", async () => {
    mockFetch((url) => {
      if (url.endsWith("/auth/login")) {
        return { accessToken: "sk-test", tokenType: "Bearer", expiresIn: 3600, user: VENDEDOR };
      }
      throw new Error(`No hay mock para: ${url}`);
    });

    render(<AuthProvider><App /></AuthProvider>);

    fireEvent.change(screen.getByPlaceholderText("usuario@misalud.com"), {
      target: { value: "vendedor.cali@misalud.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Vendedor123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Punto de venta").length).toBeGreaterThan(0);
    });
    expect(localStorage.getItem("misalud_token")).toBe("sk-test");
  });

  it("ingresa como supervisor y redirige al tablero", async () => {
    mockFetch((url) => {
      if (url.endsWith("/auth/login")) {
        return {
          accessToken: "sk-sup",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: {
            id: 2,
            email: "supervisor.cali@misalud.com",
            fullName: "Supervisora Cali",
            role: "supervisor" as const,
            cityId: 1,
            branchId: null,
            isActive: true,
          },
        };
      }
      throw new Error(`No hay mock para: ${url}`);
    });

    render(<AuthProvider><App /></AuthProvider>);

    fireEvent.change(screen.getByPlaceholderText("usuario@misalud.com"), {
      target: { value: "supervisor.cali@misalud.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Supervisor123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText("Tablero de control")).toBeInTheDocument();
    });
  });
});