import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { sectionsForRole } from "@/layout/nav";

const STORAGE_KEY = "misalud.nav.openSections";

function loadStored(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function isItemActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const location = useLocation();
  const sections = useMemo(() => (user ? sectionsForRole(user.role) : []), [user]);

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const stored = loadStored();
    const initial: Record<string, boolean> = {};
    for (const { id } of sections) initial[id] = stored[id] ?? true;
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(open));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [open]);

  useEffect(() => {
    const active = sections.find((section) =>
      section.items.some((item) => isItemActive(location.pathname, item.to)),
    );
    if (active && !open[active.id]) {
      setOpen((prev) => ({ ...prev, [active.id]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-900 text-brand-100 transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navegación principal"
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-black text-brand-700">
              M
            </span>
            <span>
              <span className="block text-sm font-bold text-white">MiSalud</span>
              <span className="block text-[11px] text-brand-300">Gestión de droguerías</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 lg:hidden"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
          {sections.map((section) => {
            const isOpen = open[section.id] ?? true;
            return (
              <div key={section.id} className="pb-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [section.id]: !isOpen }))
                  }
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-brand-300 transition-colors hover:text-white"
                >
                  <Icon name={section.icon} className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{section.title}</span>
                  <Icon
                    name="chevron"
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      isOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>

                {isOpen && (
                  <ul className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2.5 rounded-md border-l-2 py-2 pl-3 pr-2.5 text-sm transition-colors",
                              isActive
                                ? "border-brand-300 bg-white/10 font-semibold text-white"
                                : "border-transparent text-brand-100/80 hover:bg-white/5 hover:text-white",
                            )
                          }
                        >
                          <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <p className="px-1 text-[11px] leading-relaxed text-brand-300">
            {user?.role === "super_admin"
              ? "Acceso total"
              : user?.role === "supervisor"
                ? "Gestión de ciudad"
                : "Operación de sucursal"}
          </p>
        </div>
      </aside>
    </>
  );
}