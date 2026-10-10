import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/lib/api";
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
import type { Supplier } from "@/lib/contracts";

const empty = { nit: "", name: "", address: "", phone: "", email: "" };

export function SuppliersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch = useFetch(() => listSuppliers(), []);

  function openCreate() {
    setEditing(null);
    setForm({ ...empty });
    setError(null);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      nit: s.nit,
      name: s.name,
      address: s.address ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
    });
    setError(null);
  }
  function set(key: string, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nit: form.nit!.trim(),
        name: form.name!.trim(),
        address: form.address!.trim() || undefined,
        phone: form.phone!.trim() || undefined,
        email: form.email!.trim() || undefined,
      };
      if (editing) {
        await updateSupplier(editing.id, payload);
      } else {
        await createSupplier(payload);
      }
      setForm(null);
      setEditing(null);
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar el proveedor");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Supplier) {
    if (!confirm(`¿Eliminar ${s.name}?`)) return;
    try {
      await deleteSupplier(s.id);
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar");
    }
  }

  const rows = fetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Proveedores</h1>
        <Button onClick={openCreate}>Nuevo proveedor</Button>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        {fetch.loading ? (
          <Spinner label="Cargando…" />
        ) : (
          <Table
            head={
              <>
                <Th>NIT</Th>
                <Th>Nombre</Th>
                <Th>Contacto</Th>
                <Th>Estado</Th>
                <Th></Th>
              </>
            }
          >
            {rows.map((s) => (
              <tr key={s.id}>
                <Td className="font-mono text-xs">{s.nit}</Td>
                <Td className="font-medium text-slate-800">{s.name}</Td>
                <Td>
                  <p className="text-xs">{s.phone ?? "—"}</p>
                  <p className="text-xs text-slate-400">{s.email ?? "—"}</p>
                </Td>
                <Td>{s.isActive ? <Badge tone="green">Activo</Badge> : <Badge tone="slate">Inactivo</Badge>}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                    {isAdmin && (
                      <Button variant="danger" size="sm" onClick={() => handleDelete(s)}>Eliminar</Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin proveedores</EmptyState>}
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="font-bold text-slate-800">{editing ? "Editar proveedor" : "Nuevo proveedor"}</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => { setForm(null); setEditing(null); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.nit ?? ""} onChange={(e) => set("nit", e.target.value)} placeholder="NIT (900123456-1)" required />
                <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Nombre" required />
              </div>
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Dirección (opcional)" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="Teléfono (opcional)" />
                <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="Email (opcional)" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setForm(null); setEditing(null); }}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}