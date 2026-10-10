import { AuthProvider } from "@/context/AuthContext";
import type { AuthUserSanitized } from "@/lib/contracts";

export const VENDEDOR: AuthUserSanitized = {
  id: 3,
  email: "vendedor.cali@misalud.com",
  fullName: "Vendedor Cali Centro",
  role: "vendedor",
  cityId: 1,
  branchId: 1,
  isActive: true,
  branch: { id: 1, name: "MiSalud Cali Centro" },
};

export const SUPERVISOR: AuthUserSanitized = {
  id: 2,
  email: "supervisor.cali@misalud.com",
  fullName: "Supervisora Cali",
  role: "supervisor",
  cityId: 1,
  branchId: null,
  isActive: true,
  city: { id: 1, name: "Cali" },
};

export const SUPERADMIN: AuthUserSanitized = {
  id: 1,
  email: "superadmin@misalud.com",
  fullName: "Administradora Global",
  role: "super_admin",
  cityId: null,
  branchId: null,
  isActive: true,
};

export type Responder = (url: string, init?: RequestInit) => Promise<unknown> | unknown;

export function mockFetch(responder: Responder) {
  const fn = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const result = responder(url, init);
    return Promise.resolve(result).then((body) => {
      if (body instanceof Error) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: body.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  }) as typeof fetch;
  globalThis.fetch = fn;
  return fn;
}

// Export reiniciado del provider para tests que necesitan sesión precargada.
export { AuthProvider };