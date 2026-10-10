// Utilidades de saneamiento y validación (defensa en profundidad XSS / inyección).
// React escapa el texto por defecto, pero aplicamos saneamiento explícito a toda
// entrada de usuario antes de enviarla al backend y antes de mostrarla, y reglas
// de validación estricta con expresiones regulares.

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Elimina caracteres de control y etiquetas < > (deja texto plano seguro). */
export function sanitizeText(value: unknown): string {
  if (value == null) return "";
  return String(value).replace(CONTROL_CHARS, "").replace(/[<>]/g, "").trim();
}

/** Sanea y limita longitud; útil para campos de texto del POS. */
export function sanitizeField(value: unknown, maxLength = 200): string {
  return sanitizeText(value).slice(0, maxLength);
}

/** Escapa entidades HTML (solo necesario si se construye HTML manualmente). */
export function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/**
 * Normaliza un término de búsqueda para uso en consultas: sin caracteres de
 * control y sin comillas ni operadores de patrón. El backend usa TypeORM con
 * parámetros enlazados (nunca concatenación de SQL), por lo que no hay
 * inyección SQL posible; esto solo evita ruido en el filtrado.
 */
export function sanitizeSearch(value: unknown): string {
  return sanitizeText(value).replace(/["'`%;\\]/g, "").slice(0, 80);
}

export const PATTERNS = {
  name: /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,79}$/u,
  document: /^\d{4,20}$/,
  prescriptionNumber: /^[A-Za-z0-9-]{3,30}$/,
  code: /^[A-Za-z0-9._-]{1,30}$/,
  nit: /^\d{6,15}-?\d?$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  phone: /^[+()\d\s-]{7,20}$/,
  invimaNumber: /^[A-Za-z0-9-]{4,30}$/,
} as const;

export type PatternName = keyof typeof PATTERNS;

export function isValid(value: string, pattern: PatternName): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && PATTERNS[pattern].test(trimmed);
}

export function isValidEmail(value: string): boolean {
  return value.length <= 120 && PATTERNS.email.test(value.trim());
}

export function isValidName(value: string): boolean {
  return PATTERNS.name.test(sanitizeField(value, 80));
}

export function isValidPrescriptionNumber(value: string): boolean {
  return PATTERNS.prescriptionNumber.test(value.trim());
}