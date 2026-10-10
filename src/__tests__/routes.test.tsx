import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { VENDEDOR, SUPERADMIN } from "@/test/helpers";

function GateRoutes({ user, start = "/users" }: { user: any; start?: string }) {
  return (
    <MemoryRouter initialEntries={[start]}>
      <AuthProvider initialUser={user} initialToken="sk-test">
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route
            path="/users"
            element={
              <RequireRole roles={["super_admin", "supervisor"]}>
                <div>Página de usuarios</div>
              </RequireRole>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RequireRole (gating de rutas)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("deja pasar a un super_admin a /users", () => {
    render(<GateRoutes user={SUPERADMIN} />);
    expect(screen.getByText("Página de usuarios")).toBeInTheDocument();
  });

  it("redirige a un vendedor fuera de /users hacia /dashboard", () => {
    render(<GateRoutes user={VENDEDOR} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Página de usuarios")).not.toBeInTheDocument();
  });

  it("redirige a /login cuando no hay sesión", () => {
    render(
      <MemoryRouter initialEntries={["/users"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <Routes>
            <Route path="/login" element={<div>Login</div>} />
            <Route
              path="/users"
              element={
                <RequireRole roles={["super_admin"]}>
                  <div>Página de usuarios</div>
                </RequireRole>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});