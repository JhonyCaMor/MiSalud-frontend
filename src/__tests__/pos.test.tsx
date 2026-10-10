import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { PosPage } from "@/pages/PosPage";
import { VENDEDOR } from "@/test/helpers";

function mockPosFetch() {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const fn = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    let body: unknown;
    if (init?.body) body = JSON.parse(String(init.body));
    calls.push({ url, method, body });

    let response: unknown;
    if (url.includes("/inventory")) {
      response = [
        {
          id: 1,
          medicineId: 10,
          quantityAvailable: 5,
          quantityReserved: 0,
          medicine: {
            id: 10,
            code: "ACETAMINO-500",
            name: "Acetaminofén 500 mg",
            presentation: "Tableta x 20",
            activeIngredient: "Acetaminofén",
            category: "Analgésico",
            requiresPrescription: false,
            isActive: true,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        },
      ];
    } else if (url.includes("/batches")) {
      response = [
        {
          id: 1,
          batchNumber: "B-001",
          medicineId: 10,
          supplierId: 1,
          branchId: 1,
          quantityReceived: 10,
          quantityRemaining: 5,
          unitCost: 10000,
          purchaseDate: "2026-07-01",
          expirationDate: "2027-07-01",
          createdAt: "2026-07-01T00:00:00Z",
          updatedAt: "2026-07-01T00:00:00Z",
          medicine: { id: 10, code: "ACETAMINO-500", name: "Acetaminofén 500 mg" },
        },
      ];
    } else if (url.includes("/prescripciones")) {
      response = {
        id: 1,
        prescriptionNumber: "FM-2026-001",
        doctorName: "Fórmula del cliente",
        doctorLicense: "N/A",
        patientName: "Cliente",
        patientDocument: "0000000000",
        branchId: 1,
        status: "vigente",
        notes: "Generada automáticamente desde el punto de venta",
        createdAt: "2026-10-07T10:00:00Z",
        updatedAt: "2026-10-07T10:00:00Z",
      };
    } else if (url.includes("/sales")) {
      response = { id: 100, total: 13000 };
    } else {
      throw new Error(`No hay mock para: ${url}`);
    }
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as typeof fetch;
  globalThis.fetch = fn;
  return calls;
}

describe("PosPage (flujo de venta vendedor)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("carga inventario, agrega producto, registra venta y muestra el modal de éxito", async () => {
    const calls = mockPosFetch();

    render(
      <AuthProvider initialUser={VENDEDOR} initialToken="sk-test">
        <PosPage />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Acetaminofén 500 mg")).toBeInTheDocument();
    });

    // Precio sugerido = unitCost * 1.3 → 13.000
    fireEvent.click(screen.getByRole("button", { name: /agregar/i }));
    expect(screen.getAllByText(/\b13\.000\b/).length).toBeGreaterThan(0);
    expect(screen.getByText("Venta actual")).toBeInTheDocument();

    // Cliente opcional
    fireEvent.change(screen.getByPlaceholderText("Consumidor final"), {
      target: { value: "Cliente Prueba" },
    });

    fireEvent.click(screen.getByRole("button", { name: /registrar venta/i }));

    await waitFor(() => {
      expect(screen.getByText(/venta registrada/i)).toBeInTheDocument();
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    const saleCall = calls.find((c) => c.method === "POST" && c.url.includes("/sales"));
    expect(saleCall).toBeDefined();
    expect(saleCall?.body).toEqual({
      customerName: "Cliente Prueba",
      items: [{ medicineId: 10, quantity: 1, unitPrice: 13000 }],
    });
  });

  it("exige número de fórmula cuando el producto la requiere", async () => {
    // hacer que el producto requiera receta
    const fn = ((input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/inventory")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: 1,
                medicineId: 20,
                quantityAvailable: 2,
                quantityReserved: 0,
                medicine: {
                  id: 20,
                  code: "IBUPRO-400",
                  name: "Ibuprofeno 400 mg",
                  presentation: "Tableta x 10",
                  activeIngredient: "Ibuprofeno",
                  category: "Antiinflamatorio",
                  requiresPrescription: true,
                  isActive: true,
                  createdAt: "2026-01-01T00:00:00Z",
                  updatedAt: "2026-01-01T00:00:00Z",
                },
              },
            ]),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      if (url.includes("/batches")) {
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ message: "no mock" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as typeof fetch;
    globalThis.fetch = fn;

    render(
      <AuthProvider initialUser={VENDEDOR} initialToken="sk-test">
        <PosPage />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Ibuprofeno 400 mg")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /agregar/i }));
    expect(screen.getByText(/requiere fórmula médica/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /registrar venta/i }));

    await waitFor(() => {
      expect(screen.getByText(/número de fórmula válido/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/venta registrada/i)).not.toBeInTheDocument();
  });
});