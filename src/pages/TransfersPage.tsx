import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { listTransfers, createTransfer, updateTransferStatus, listBranches, listInventory } from "@/lib/api";
import { ApiError } from "@/lib/client";
import { formatDate } from "@/lib/format";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Spinner,
  Table,
  Td,
  Th,
} from "@/components/ui";

interface Line {
  medicineId: string;
  quantity: string;
}

export function TransfersPage() {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ medicineId: "", quantity: "" }]);

  const fetch = useFetch(() => listTransfers(), []);
  const branchFetch = useFetch(() => listBranches(), []);
  const invFetch = useFetch(() => listInventory(fromBranch || undefined), [fromBranch]);

  const statusTone: Record<string, "slate" | "blue" | "green" | "red"> = {
    pendiente: "slate",
    en_transito: "blue",
    recibido: "green",
    cancelado: "red",
  };

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTransfer({
        fromBranchId: Number(fromBranch),
        toBranchId: Number(toBranch),
        notes: notes.trim() || undefined,
        items: lines
          .filter((l) => l.medicineId && Number(l.quantity) > 0)
          .map((l) => ({ medicineId: Number(l.medicineId), quantity: Number(l.quantity) })),
      });
      setShowForm(false);
      setFromBranch("");
      setToBranch("");
      setNotes("");
      setLines([{ medicineId: "", quantity: "" }]);
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el traslado");
    } finally {
      setSaving(false);
    }
  }

  async function advance(t: { id: number; status: string }) {
    if (t.status === "en_transito") return; // solo recibir o cancelar desde pendiente/tránsito
    const next = t.status === "pendiente" ? "en_transito" : "recibido";
    setSaving(true);
    setError(null);
    try {
      await updateTransferStatus(t.id, { status: next as "en_transito" | "recibido" });
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el traslado");
    } finally {
      setSaving(false);
    }
  }

  const rows = fetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Traslados de inventario</h1>
          <p className="text-sm text-slate-500">Movimientos de stock entre sucursales</p>
        </div>
        <Button onClick={() => { setShowForm(true); setError(null); }}>Nuevo traslado</Button>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {showForm && (
        <Card title="Crear traslado">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select value={fromBranch} onChange={(e) => setFromBranch(e.target.value)} required>
                <option value="">Sucursal origen…</option>
                {(branchFetch.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
              <Select value={toBranch} onChange={(e) => setToBranch(e.target.value)} required>
                <option value="">Sucursal destino…</option>
                {(branchFetch.data ?? []).filter((b) => String(b.id) !== fromBranch).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                <span>Producto (disponible en origen)</span>
                <span className="text-right">Cantidad</span>
              </div>
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-3 border-b border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Select
                      value={line.medicineId}
                      onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, medicineId: e.target.value } : l))}
                    >
                      <option value="">Seleccionar…</option>
                      {(invFetch.data ?? []).map((it) => (
                        <option key={it.id} value={it.medicineId}>
                          {it.medicine?.name ?? it.medicineId} ({it.quantityAvailable})
                        </option>
                      ))}
                    </Select>
                    {!fromBranch && <span className="text-xs text-slate-400">elige origen</span>}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, quantity: e.target.value } : l))}
                      placeholder="Cantidad"
                      className="!w-24"
                    />
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:text-red-700"
                      onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                      disabled={lines.length === 1}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
              <div className="px-3 py-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setLines([...lines, { medicineId: "", quantity: "" }])}>
                  + Agregar producto
                </Button>
              </div>
            </div>

            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creando…" : "Crear traslado"}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {fetch.loading ? (
          <Spinner label="Cargando…" />
        ) : (
          <Table
            head={
              <>
                <Th>Origen</Th>
                <Th>Destino</Th>
                <Th>Productos</Th>
                <Th>Estado</Th>
                <Th></Th>
              </>
            }
          >
            {rows.map((t) => (
              <tr key={t.id}>
                <Td>{t.fromBranch?.name}</Td>
                <Td>{t.toBranch?.name}</Td>
                <Td>
                  {(t.items ?? []).map((i) => (
                    <span key={i.id} className="mr-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                      {i.medicine?.name ?? i.medicineId} × {i.quantity}
                    </span>
                  ))}
                </Td>
                <Td><Badge tone={statusTone[t.status] ?? "slate"}>{t.status}</Badge></Td>
                <Td>
                  {t.status === "pendiente" ? (
                    <Button variant="secondary" size="sm" disabled={saving} onClick={() => advance(t)}>
                      Enviar
                    </Button>
                  ) : t.status === "en_transito" ? (
                    <Button variant="secondary" size="sm" disabled={saving} onClick={() => advance(t)}>
                      Recibir
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {t.status === "recibido" && formatDate(t.updatedAt)}
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>No hay traslados registrados</EmptyState>}
      </Card>
    </div>
  );
}