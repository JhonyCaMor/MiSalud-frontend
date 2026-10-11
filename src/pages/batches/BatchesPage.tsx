import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { listBatches, createBatch, listBranches, listMedicines, listSuppliers } from "@/lib/api";
import { ApiError } from "@/lib/client";
import { daysUntil, formatCOP, formatDate } from "@/lib/format";
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

export function BatchesPage() {
  const [branchId, setBranchId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    medicineId: "",
    supplierId: "",
    branchId: "",
    expirationDate: "",
    quantityInitial: "",
    unitCost: "",
    notes: "",
  });

  const fetch = useFetch(() => listBatches(branchId || undefined), [branchId]);
  const branchFetch = useFetch(() => listBranches(), []);
  const medFetch = useFetch(() => listMedicines(), []);
  const supFetch = useFetch(() => listSuppliers(), []);

  const rows = (fetch.data ?? []).filter((b) => (b.quantityRemaining ?? 0) > 0 || !b.isActive);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createBatch({
        code: form.code.trim(),
        medicineId: Number(form.medicineId),
        supplierId: Number(form.supplierId),
        branchId: Number(form.branchId),
        expirationDate: form.expirationDate,
        quantityInitial: Number(form.quantityInitial),
        unitCost: Number(form.unitCost),
        notes: form.notes.trim() || undefined,
      });
      setShowForm(false);
      setForm({ code: "", medicineId: "", supplierId: "", branchId: "", expirationDate: "", quantityInitial: "", unitCost: "", notes: "" });
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el lote");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Lotes y vencimientos</h1>
        <div className="flex items-center gap-2">
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="!w-52">
            <option value="">Todas las sucursales</option>
            {(branchFetch.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Button onClick={() => { setShowForm(true); setError(null); }}>Nuevo lote</Button>
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {showForm && (
        <Card title="Ingresar lote al inventario">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Código lote (LT-2026-001)" required />
            <Select value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })} required>
              <option value="">Medicamento…</option>
              {(medFetch.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.code} · {m.name}</option>
              ))}
            </Select>
            <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
              <option value="">Proveedor…</option>
              {(supFetch.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required>
              <option value="">Sucursal…</option>
              {(branchFetch.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
            <Input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min={1} value={form.quantityInitial} onChange={(e) => setForm({ ...form, quantityInitial: e.target.value })} placeholder="Cantidad" required />
              <Input type="number" min={0} step={0.01} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} placeholder="Costo unit." required />
            </div>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas (opcional)" />
            <div className="col-span-full flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Ingresar lote"}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {fetch.loading ? (
          <Spinner label="Cargando lotes…" />
        ) : (
          <Table
            head={
              <>
                <Th>Lote</Th>
                <Th>Producto</Th>
                <Th>Sucursal</Th>
                <Th className="text-right">Disp.</Th>
                <Th className="text-right">Vence en</Th>
                <Th className="text-right">Costo</Th>
              </>
            }
          >
            {rows.map((b) => {
              const d = daysUntil(b.expirationDate);
              return (
                <tr key={b.id}>
                  <Td className="font-mono text-xs">{b.code}</Td>
                  <Td>
                    <p className="font-medium text-slate-800">{b.medicine?.name}</p>
                    <p className="text-xs text-slate-400">{b.supplier?.name}</p>
                  </Td>
                  <Td>{b.branch?.name}</Td>
                  <Td className="text-right">{b.quantityRemaining}</Td>
                  <Td className="text-right">
                    {d !== null && d < 0 ? (
                      <Badge tone="red">Vencido</Badge>
                    ) : d !== null && d <= 90 ? (
                      <Badge tone="amber">{d} días</Badge>
                    ) : (
                      <span className="text-slate-500">{formatDate(b.expirationDate)}</span>
                    )}
                  </Td>
                  <Td className="text-right">{formatCOP(b.unitCost)}</Td>
                </tr>
              );
            })}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin lotes registrados</EmptyState>}
      </Card>
    </div>
  );
}