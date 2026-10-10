import type { Role } from "@/lib/contracts";
import type { IconName } from "@/components/icons";

export type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  roles: Role[];
};

export type NavSection = {
  id: string;
  title: string;
  icon: IconName;
  roles: Role[];
  items: NavItem[];
};

/**
 * Estructura del menú lateral agrupada por dominio funcional.
 * Las secciones y sus ítems se filtran por rol en tiempo de render; las
 * secciones que quedan vacías se ocultan automáticamente.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "principal",
    title: "Principal",
    icon: "dashboard",
    roles: ["supervisor", "super_admin"],
    items: [
      { to: "/dashboard", label: "Tablero / Analytics", icon: "chart", roles: ["supervisor", "super_admin"] },
    ],
  },
  {
    id: "operaciones",
    title: "Operaciones y Ventas",
    icon: "cart",
    roles: ["vendedor", "supervisor", "super_admin"],
    items: [
      { to: "/pos", label: "Punto de venta", icon: "cart", roles: ["vendedor"] },
      { to: "/sales", label: "Historial de ventas", icon: "receipt", roles: ["vendedor", "supervisor", "super_admin"] },
      { to: "/invoicing", label: "Facturación electrónica", icon: "invoice", roles: ["supervisor", "super_admin"] },
      { to: "/transfers", label: "Traslados", icon: "transfer", roles: ["supervisor", "super_admin"] },
    ],
  },
  {
    id: "inventario",
    title: "Inventario y Logística",
    icon: "box",
    roles: ["vendedor", "supervisor", "super_admin"],
    items: [
      { to: "/inventory", label: "Inventario", icon: "box", roles: ["vendedor", "supervisor", "super_admin"] },
      { to: "/medicines", label: "Medicamentos", icon: "pill", roles: ["supervisor", "super_admin"] },
      { to: "/batches", label: "Lotes y vencimientos", icon: "layers", roles: ["supervisor", "super_admin"] },
      { to: "/suppliers", label: "Proveedores", icon: "truck", roles: ["supervisor", "super_admin"] },
      { to: "/invima", label: "Registros INVIMA", icon: "shield", roles: ["super_admin"] },
    ],
  },
  {
    id: "regulacion",
    title: "Regulación Farmacéutica",
    icon: "shield",
    roles: ["vendedor", "supervisor", "super_admin"],
    items: [
      { to: "/temperature", label: "Temperatura y humedad", icon: "thermometer", roles: ["vendedor", "supervisor", "super_admin"] },
      { to: "/prescriptions", label: "Fórmulas médicas", icon: "file", roles: ["vendedor", "supervisor", "super_admin"] },
      { to: "/pharmacovigilance", label: "Farmacovigilancia", icon: "alert", roles: ["vendedor", "supervisor", "super_admin"] },
    ],
  },
  {
    id: "admin",
    title: "Administración y Configuración",
    icon: "settings",
    roles: ["supervisor", "super_admin"],
    items: [
      { to: "/branches", label: "Sucursales y ciudades", icon: "store", roles: ["super_admin"] },
      { to: "/users", label: "Usuarios", icon: "users", roles: ["supervisor", "super_admin"] },
      { to: "/audit", label: "Auditoría", icon: "clipboard", roles: ["super_admin"] },
    ],
  },
];

export function sectionsForRole(role: Role) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.roles.includes(role) && section.items.length > 0);
}