import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listSanitaryRecords, createSanitaryRecord, listMedicines } from "@/lib/api";
import { ApiError } from "@/lib/client";
import { daysUntil, formatDate } from "@/lib/format";
import { SANITARY_CATEGORIES } from "@/lib/contracts";
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

export function InvimaPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    invimaCode: "",
    resolutionNumber: "",
    description: "",
    category: "Medicamento",
    issuedAt: "",
    expiresAt: "",
    medicineId: "",
  });

  const fetch = useFetch(() => listSanitaryRecords(), []);
  const medFetch = useFetch(() => listMedicines(), []);

  const rows = fetch.data ?? [];

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createSanitaryRecord({
        invimaCode: form.invimaCode.trim(),
        resolutionNumber: form.resolutionNumber.trim(),
        description: form.description.trim(),
        category: form.category as "Medicamento" | "Dispositivo médico" | "Insumo" | "Cosmético",
        issuedAt: form.issuedAt,
        expiresAt: form.expiresAt || undefined,
        medicineId: form.medicineId ? Number(form.medicineId) : undefined,
      });
      setShowForm(false);
      setForm({ invimaCode: "", resolutionNumber: "", description: "", category: "Medicamento", issuedAt: "", expiresAt: "", medicineId: "" });
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar el registro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Registros sanitarios INVIMA</h1>
          <p className="text-sm text-slate-500">
            Vigencia de registros sanitarios. Vista {isAdmin ? "completa (gestión)" : "consulta"}.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowForm(true); setError(null); }}>Nuevo registro</Button>
        )}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {showForm && (
        <Card title="Nuevo registro sanitario">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input value={form.invimaCode} onChange={(e) => setForm({ ...form, invimaCode: e.target.value })} placeholder="Código INVIMA" required />
            <Input value={form.resolutionNumber} onChange={(e) => setForm({ ...form, resolutionNumber: e.target.value })} placeholder="Resolución" required />
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {SANITARY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" className="lg:col-span-2" required />
            <Select value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })}>
              <option value="">Medicamento (opcional)…</option>
              {(medFetch.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.code} · {m.name}</option>
              ))}
            </Select>
            <Input type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} required />
            <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-1">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
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
                <Th>Resolución</Th>
                <Th>Descripción</Th>
                <Th>Categoría</Th>
                <Th>Vigencia</Th>
              </>
            }
          >
            {rows.map((r) => {
              const days = daysUntil(r.expiresAt);
              return (
                <tr key={r.id}>
                  <Td>
                    <p className="font-mono text-xs font-semibold text-slate-800">{r.invimaCode}</p>
                    <p className="text-xs text-slate-400">{r.resolutionNumber}</p>
                  </Td>
                  <Td>
                    <p className="font-medium text-slate-800">{r.description}</p>
                    <p className="text-xs text-slate-400">{r.medicine?.name ?? "—"}</p>
                  </Td>
                  <Td><Badge tone="blue">{r.category}</Badge></Td>
                  <Td>
                    {r.expiresAt ? (
                      days !== null && days < 0 ? (
                        <Badge tone="red">Vencido</Badge>
                      ) : days !== null && days <= 180 ? (
                        <Badge tone="amber">{formatDate(r.expiresAt)} · {days} días</Badge>
                      ) : (
                        formatDate(r.expiresAt)
                      )
                    ) : (
                      "Sin expiración"
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>No hay registros sanitarios</EmptyState>}
      </Card>
    </div>
  );
}