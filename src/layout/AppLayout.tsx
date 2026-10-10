import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Icon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/layout/Sidebar";

export function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel =
    user?.role === "super_admin"
      ? "Superadministrador"
      : user?.role === "supervisor"
        ? "Supervisor"
        : "Vendedor";

  return (
    <div className="flex h-full">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.branch?.name ?? user?.city?.name ?? "Administración general"}
            </p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 sm:flex">
              {user?.fullName?.slice(0, 1).toUpperCase() ?? "U"}
            </span>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Cerrar sesión"
              className="ml-1 flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}