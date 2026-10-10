import { describe, it, expect } from "vitest";
import {
  sanitizeField,
  isValidEmail,
  isValidName,
  isValidPrescriptionNumber,
} from "@/lib/security";

describe("seguridad de entrada (XSS / validación)", () => {
  it("neutraliza etiquetas y scripts en texto libre", () => {
    expect(sanitizeField("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
    expect(sanitizeField("  Juan <b>Pérez</b>  ")).toBe("Juan bPérez/b");
  });

  it("recorta a la longitud máxima indicada", () => {
    expect(sanitizeField("x".repeat(200), 10)).toHaveLength(10);
  });

  it("acepta números de fórmula válidos y rechaza caracteres peligrosos", () => {
    expect(isValidPrescriptionNumber("FM-2026-001")).toBe(true);
    expect(isValidPrescriptionNumber("<img src=x>")).toBe(false);
    expect(isValidPrescriptionNumber("FM 2026/01")).toBe(false);
  });

  it("valida correos electrónicos", () => {
    expect(isValidEmail("admin@misalud.com")).toBe(true);
    expect(isValidEmail("no-es-email")).toBe(false);
  });

  it("acepta nombres con acentos y rechaza payloads", () => {
    expect(isValidName("María Camila Ospina")).toBe(true);
    expect(isValidName("<img src=x onerror=alert(1)>")).toBe(false);
  });
});