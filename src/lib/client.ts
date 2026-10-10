const TOKEN_KEY = "misalud_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface ErrorShape {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

function pickErrorMessage(status: number, body: ErrorShape): string {
  if (body.message) {
    return Array.isArray(body.message) ? body.message.join(". ") : body.message;
  }
  if (body.error) return body.error;
  if (status === 401) return "Sesión expirada o credenciales incorrectas";
  if (status === 403) return "No tienes permiso para realizar esta acción";
  if (status === 404) return "Recurso no encontrado";
  if (status === 409) return "Ya existe un registro con esos datos";
  if (status === 429) return "Demasiados intentos. Intenta de nuevo en unos minutos";
  if (status >= 500) return "Error interno del servidor";
  return "Ocurrió un error inesperado";
}

async function handle<T>(res: Response): Promise<T> {
  const isJson = (res.headers.get("content-type") ?? "").includes("json");
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new ApiError(res.status, pickErrorMessage(res.status, body as ErrorShape), body);
  }
  return body as T;
}

function buildUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE ?? "/api";
  return `${base}${path}`;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(buildUrl(path), { method, headers, body: payload });
  return handle<T>(res);
}

export const api = {
  get<T>(path: string) {
    return request<T>("GET", path);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>("POST", path, body);
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>("PATCH", path, body);
  },
  del<T>(path: string) {
    return request<T>("DELETE", path);
  },
};