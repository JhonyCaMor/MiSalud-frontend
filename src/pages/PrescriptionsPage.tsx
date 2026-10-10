import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listPrescriptions, createPrescription, updatePrescriptionStatus } from "@/lib/api";
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
import type { Prescription } from "@/lib/contracts";

export function PrescriptionsPage() {
  const { user } = useAuth();
  const canManage = user?.role !== "vendedor";
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    prescriptionNumber: "",
    doctorName: "",
    doctorLicense: "",
    patientName: "",
    patientDocument: "",
    notes: "",
  });
  const [statusTarget, setStatusTarget] = useState<Prescription | null>(null);
  const [newStatus, setNewStatus] = useState("activa");
  const [reason, setReason] = useState("");

  const fetch = useFetch(() => listPrescriptions(), []);

  const statusTone: Record<string, "green" | "amber" | "red" | "slate"> = {
    activa: "green",
    retenida: "amber",
    anulada: "red",
  };

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createPrescription({
        ...form,
        notes: form.notes.trim() || undefined,
        branchId: canManage ? undefined : user?.branchId ?? undefined,
      });
      setShowForm(false);
      setForm({ prescriptionNumber: "", doctorName: "", doctorLicense: "", patientName: "", patientDocument: "", notes: "" });
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar la fórmula");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus() {
    if (!statusTarget) return;
    setSaving(true);
    setError(null);
    try {
      await updatePrescriptionStatus(statusTarget.id, {
        status: newStatus as "activa" | "retenida" | "anulada",
        retainedReason: newStatus === "retenida" ? reason.trim() || undefined : undefined,
      });
      setStatusTarget(null);
      setReason("");
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  const rows = fetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Fórmulas médicas</h1>
          <p className="text-sm text-slate-500">
            Registro y control de retención de prescripciones (Res. 1403/2005)
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setError(null); }}>Registrar fórmula</Button>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {showForm && (
        <Card title="Registrar fórmula médica">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input value={form.prescriptionNumber} onChange={(e) => setForm({ ...form, prescriptionNumber: e.target.value })} placeholder="N° fórmula (FM-2026-001)" required />
            <Input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} placeholder="Médico" required />
            <Input value={form.doctorLicense} onChange={(e) => setForm({ ...form, doctorLicense: e.target.value })} placeholder="Registro profesional" required />
            <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Paciente" required />
            <Input value={form.patientDocument} onChange={(e) => setForm({ ...form, patientDocument: e.target.value })} placeholder="Documento paciente" required />
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas (opcional)" />
            <div className="col-span-full flex justify-end gap-2">
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
                <Th>N°</Th>
                <Th>Paciente</Th>
                <Th>Médico</Th>
                <Th>Sucursal</Th>
                <Th>Estado</Th>
                <Th></Th>
              </>
            }
          >
            {rows.map((p) => (
              <tr key={p.id}>
                <Td className="font-mono text-xs">{p.prescriptionNumber}</Td>
                <Td>
                  <p className="font-medium text-slate-800">{p.patientName}</p>
                  <p className="text-xs text-slate-400">Doc. {p.patientDocument}</p>
                </Td>
                <Td>
                  <p>{p.doctorName}</p>
                  <p className="text-xs text-slate-400">{p.doctorLicense}</p>
                </Td>
                <Td>{p.branch?.name}</Td>
                <Td>
                  <Badge tone={statusTone[p.status] ?? "slate"}>{p.status}</Badge>
                  {p.status === "retenida" && p.retainedReason && (
                    <p className="mt-1 text-xs text-slate-400">{p.retainedReason}</p>
                  )}
                </Td>
                <Td>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setStatusTarget(p);
                        setNewStatus(p.status);
                        setReason(p.retainedReason ?? "");
                        setError(null);
                      }}
                    >
                      Cambiar estado
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin fórmulas registradas</EmptyState>}
      </Card>

      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-3 font-bold text-slate-800">
              Fórmula {statusTarget.prescriptionNumber}
            </h3>
            <div className="space-y-3">
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="activa">Activa</option>
                <option value="retenida">Retenida</option>
                <option value="anulada">Anulada</option>
              </Select>
              {newStatus === "retenida" && (
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de retención (obligatorio)" />
              )}
              <p className="text-xs text-slate-400">
                Registrada {formatDateTime(statusTarget.createdAt)}
              </p>
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