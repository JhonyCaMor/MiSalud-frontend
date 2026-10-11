import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listMedicines, createMedicine, updateMedicine, deleteMedicine } from "@/lib/api";
import { ApiError } from "@/lib/client";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Spinner,
  Table,
  Td,
  Th,
} from "@/components/ui";
import type { Medicine } from "@/lib/contracts";

const emptyForm = {
  name: "",
  activeIngredient: "",
  concentration: "",
  presentation: "",
  category: "",
  invimaNumber: "",
  requiresPrescription: false,
};

export function MedicinesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Record<string, unknown>>(null as never);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch = useFetch(() => listMedicines(search), [search]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setError(null);
  }

  function openEdit(m: Medicine) {
    setEditing(m);
    setForm({
      name: m.name,
      activeIngredient: m.activeIngredient,
      concentration: m.concentration,
      presentation: m.presentation,
      category: m.category,
      invimaNumber: m.invimaNumber,
      requiresPrescription: m.requiresPrescription,
    });
    setError(null);
  }

  function close() {
    setForm(null as never);
    setEditing(null);
    setError(null);
  }

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        requiresPrescription: Boolean(form.requiresPrescription),
      } as Parameters<typeof createMedicine>[0];
      if (editing) {
        await updateMedicine(editing.id, payload);
      } else {
        await createMedicine(payload);
      }
      close();
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m: Medicine) {
    if (!confirm(`¿Eliminar ${m.name}?`)) return;
    try {
      await deleteMedicine(m.id);
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar");
    }
  }

  const rows = fetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Medicamentos</h1>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="!w-56"
          />
          <Button onClick={openCreate}>Nuevo medicamento</Button>
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
                <Th>Código</Th>
                <Th>Nombre</Th>
                <Th>Registro INVIMA</Th>
                <Th>Estado</Th>
                <Th></Th>
              </>
            }
          >
            {rows.map((m) => (
              <tr key={m.id}>
                <Td className="font-mono text-xs">{m.code}</Td>
                <Td>
                  <p className="font-medium text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-400">
                    {m.activeIngredient} · {m.concentration} · {m.presentation}
                  </p>
                </Td>
                <Td className="font-mono text-xs">{m.invimaNumber}</Td>
                <Td>
                  {m.requiresPrescription ? (
                    <Badge tone="amber">Fórmula</Badge>
                  ) : m.isActive ? (
                    <Badge tone="green">Activo</Badge>
                  ) : (
                    <Badge tone="slate">Inactivo</Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(m)}>
                      Editar
                    </Button>
                    {isAdmin && (
                      <Button variant="danger" size="sm" onClick={() => handleDelete(m)}>
                        Eliminar
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin medicamentos</EmptyState>}
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="font-bold text-slate-800">
                {editing ? `Editar ${editing.name}` : "Nuevo medicamento"}
              </h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={close}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
              <Input value={String(form.name ?? "")} onChange={(e) => set("name", e.target.value)} placeholder="Nombre (ej. Paracetamol Tableta 500 mg)" required />
              <div className="grid grid-cols-2 gap-3">
                <Input value={String(form.activeIngredient ?? "")} onChange={(e) => set("activeIngredient", e.target.value)} placeholder="Principio activo" required />
                <Input value={String(form.concentration ?? "")} onChange={(e) => set("concentration", e.target.value)} placeholder="Concentración (500 mg)" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={String(form.presentation ?? "")} onChange={(e) => set("presentation", e.target.value)} placeholder="Presentación (Tableta)" required />
                <Input value={String(form.category ?? "")} onChange={(e) => set("category", e.target.value)} placeholder="Categoría (opcional)" />
              </div>
              <Input value={String(form.invimaNumber ?? "")} onChange={(e) => set("invimaNumber", e.target.value)} placeholder="INVIMA2024M-001234" required />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.requiresPrescription)}
                  onChange={(e) => set("requiresPrescription", e.target.checked)}
                />
                Requiere prescripción médica
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={close}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}