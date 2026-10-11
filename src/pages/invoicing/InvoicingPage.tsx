import { useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { listInvoices, createInvoice, updateInvoiceStatus, listSales } from "@/lib/api";
import { ApiError } from "@/lib/client";
import { formatCOP, formatDateTime } from "@/lib/format";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Spinner,
  Table,
  Td,
  Th,
} from "@/components/ui";
import type { ElectronicInvoice } from "@/lib/contracts";

const statusTone: Record<string, "slate" | "blue" | "green" | "red" | "amber"> = {
  borrador: "slate",
  enviada: "blue",
  aceptada: "green",
  rechazada: "red",
  anulada: "amber",
};

export function InvoicingPage() {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedSale, setSelectedSale] = useState("");
  const [statusTarget, setStatusTarget] = useState<ElectronicInvoice | null>(null);
  const [newStatus, setNewStatus] = useState("enviada");
  const [dianResponse, setDianResponse] = useState("");

  const fetch = useFetch(() => listInvoices(), []);
  const salesFetch = useFetch(() => listSales(), []);

  async function handleCreate() {
    if (!selectedSale) return;
    setSaving(true);
    setError(null);
    try {
      await createInvoice({ saleId: Number(selectedSale) });
      setSelectedSale("");
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al generar la factura");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus() {
    if (!statusTarget) return;
    setSaving(true);
    setError(null);
    try {
      await updateInvoiceStatus(statusTarget.id, {
        status: newStatus as "borrador" | "enviada" | "aceptada" | "rechazada" | "anulada",
        dianResponse: dianResponse.trim() || undefined,
      });
      setStatusTarget(null);
      setDianResponse("");
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  const exists: Record<number, boolean> = {};
  for (const inv of fetch.data ?? []) exists[inv.saleId] = true;
  const pendingSales = (salesFetch.data ?? []).filter((s) => !exists[s.id] && s.status === "completada");

  const rows = fetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Facturación electrónica</h1>
          <p className="text-sm text-slate-500">Facturación electrónica de venta (DIAN) con CUFE</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedSale}
            onChange={(e) => setSelectedSale(e.target.value)}
            className="!w-60"
          >
            <option value="">Venta pendiente de facturar…</option>
            {pendingSales.map((s) => (
              <option key={s.id} value={s.id}>
                Venta #{s.id} · {formatCOP(s.total)}
              </option>
            ))}
          </Select>
          <Button disabled={!selectedSale || saving} onClick={handleCreate}>
            {saving ? "…" : "Facturar"}
          </Button>
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        {fetch.loading ? (
          <Spinner label="Cargando…" />
        ) : (
          <Table
            head={
              <>
                <Th>Factura</Th>
                <Th>Venta</Th>
                <Th className="text-right">Total</Th>
                <Th>Estado</Th>
                <Th>CUFE</Th>
                <Th></Th>
              </>
            }
          >
            {rows.map((inv) => (
              <tr key={inv.id}>
                <Td>
                  <p className="font-mono text-xs font-semibold text-slate-800">{inv.invoiceNumber}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(inv.issuedAt)}</p>
                </Td>
                <Td>Venta #{inv.saleId}</Td>
                <Td className="text-right font-semibold">{formatCOP(inv.total)}</Td>
                <Td><Badge tone={statusTone[inv.status] ?? "slate"}>{inv.status}</Badge></Td>
                <Td className="max-w-[160px] truncate font-mono text-xs">{inv.cufe}</Td>
                <Td>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setStatusTarget(inv);
                      setNewStatus(inv.status);
                      setDianResponse(inv.dianResponse ?? "");
                      setError(null);
                    }}
                  >
                    Estado
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>No hay facturas electrónicas</EmptyState>}
      </Card>

      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-3 font-bold text-slate-800">{statusTarget.invoiceNumber}</h3>
            <div className="space-y-3">
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aceptada">Aceptada</option>
                <option value="rechazada">Rechazada</option>
                <option value="anulada">Anulada</option>
              </Select>
              {(newStatus === "rechazada" || newStatus === "aceptada") && (
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={dianResponse}
                  onChange={(e) => setDianResponse(e.target.value)}
                  placeholder="Respuesta DIAN (opcional)"
                />
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStatusTarget(null)}>Cancelar</Button>
              <Button disabled={saving} onClick={handleStatus}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}