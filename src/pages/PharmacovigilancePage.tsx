import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listReports, createReport, updateReportStatus, listMedicines, listSales } from "@/lib/api";
import { ApiError } from "@/lib/client";
import { formatDateTime } from "@/lib/format";
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
import type { AdverseEventReport } from "@/lib/contracts";

export function PharmacovigilancePage() {
  const { user } = useAuth();
  const canManage = user?.role !== "vendedor";
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicineId: "",
    saleId: "",
    patientName: "",
    description: "",
    severity: "leve",
  });

  const fetch = useFetch(() => listReports(), []);
  const medFetch = useFetch(() => listMedicines(), []);
  const salesFetch = useFetch(() => listSales(), []);

  const severityTone: Record<string, "slate" | "amber" | "red"> = {
    leve: "slate",
    moderado: "amber",
    grave: "red",
  };
  const statusTone: Record<string, "slate" | "blue" | "violet" | "green"> = {
    recibido: "slate",
    en_revision: "blue",
    enviado_invima: "violet",
    cerrado: "green",
  };

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createReport({
        medicineId: Number(form.medicineId),
        saleId: form.saleId ? Number(form.saleId) : undefined,
        patientName: form.patientName.trim(),
        description: form.description.trim(),
        severity: form.severity as "leve" | "moderado" | "grave",
        branchId: canManage ? undefined : user?.branchId ?? undefined,
      });
      setShowForm(false);
      setForm({ medicineId: "", saleId: "", patientName: "", description: "", severity: "leve" });
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar el reporte");
    } finally {
      setSaving(false);
    }
  }

  async function advanceStatus(report: AdverseEventReport, status: string) {
    setSaving(true);
    setError(null);
    try {
      await updateReportStatus(report.id, { status: status as "recibido" | "en_revision" | "enviado_invima" | "cerrado" });
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  const nextStatus: Record<string, string> = {
    recibido: "en_revision",
    en_revision: "enviado_invima",
    enviado_invima: "cerrado",
  };

  const rows = fetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Farmacovigilancia</h1>
          <p className="text-sm text-slate-500">
            Reportes de eventos adversos a medicamentos (Programa de Farmacovigilancia)
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setError(null); }}>Reportar evento</Button>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {showForm && (
        <Card title="Nuevo reporte de evento adverso">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })} required>
              <option value="">Medicamento…</option>
              {(medFetch.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.code} · {m.name}</option>
              ))}
            </Select>
            <Select value={form.saleId} onChange={(e) => setForm({ ...form, saleId: e.target.value })}>
              <option value="">Venta relacionada (opcional)…</option>
              {(salesFetch.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>Venta #{s.id} · {s.customerName ?? "Consumidor"}</option>
              ))}
            </Select>
            <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Paciente" required />
            <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="grave">Grave</option>
            </Select>
            <textarea
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:col-span-2"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describa el evento adverso (mín. 10 caracteres)"
              required
            />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar reporte"}</Button>
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
                <Th>Fecha</Th>
                <Th>Medicamento</Th>
                <Th>Paciente</Th>
                <Th>Severidad</Th>
                <Th>Estado</Th>
                <Th></Th>
              </>
            }
          >
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{formatDateTime(r.createdAt)}</Td>
                <Td>
                  <p className="font-medium text-slate-800">{r.medicine?.name}</p>
                  <p className="text-xs text-slate-400">{r.branch?.name}</p>
                </Td>
                <Td>{r.patientName}</Td>
                <Td><Badge tone={severityTone[r.severity] ?? "slate"}>{r.severity}</Badge></Td>
                <Td><Badge tone={statusTone[r.status] ?? "slate"}>{r.status}</Badge></Td>
                <Td>
                  {canManage && nextStatus[r.status] && (
                    <Button variant="secondary" size="sm" disabled={saving} onClick={() => advanceStatus(r, nextStatus[r.status])}>
                      Pasar a {nextStatus[r.status].replace("_", " ")}
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin reportes de farmacovigilancia</EmptyState>}
      </Card>
    </div>
  );
}