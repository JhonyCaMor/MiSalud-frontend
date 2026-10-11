import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listUsers, createUser, updateUser, listBranches, listCities } from "@/lib/api";
import { ApiError } from "@/lib/client";
import { ROLES, type Role } from "@/lib/contracts";
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
import type { User } from "@/lib/contracts";

const empty = { email: "", password: "", fullName: "", role: "vendedor", cityId: "", branchId: "" };

export function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch = useFetch(() => listUsers({}), []);
  const branchFetch = useFetch(() => listBranches(), []);
  const cityFetch = useFetch(() => listCities(), []);

  const roleTone: Record<string, "violet" | "blue" | "green"> = {
    super_admin: "violet",
    supervisor: "blue",
    vendedor: "green",
  };

  function openCreate() {
    setEditing(null);
    setForm({ ...empty });
    setError(null);
  }
  function openEdit(u: User) {
    setEditing(u);
    setForm({
      email: u.email,
      password: "",
      fullName: u.fullName,
      role: u.role,
      cityId: u.cityId ? String(u.cityId) : "",
      branchId: u.branchId ? String(u.branchId) : "",
    });
    setError(null);
  }
  function set(key: string, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    if (key === "role") {
      const role = value as Role;
      if (role === "super_admin") {
        setForm((f) => (f ? { ...f, cityId: "", branchId: "" } : f));
      } else if (role === "supervisor") {
        setForm((f) => (f ? { ...f, branchId: "" } : f));
      } else {
        setForm((f) => (f ? { ...f, cityId: "" } : f));
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const role = form.role as Role;
      const payload = {
        email: form.email!.trim(),
        fullName: form.fullName!.trim(),
        role,
        cityId: role === "supervisor" ? Number(form.cityId) : undefined,
        branchId: role === "vendedor" ? Number(form.branchId) : undefined,
      };
      if (editing) {
        await updateUser(editing.id, payload);
      } else {
        await createUser({
          ...payload,
          password: form.password!,
        });
      }
      setForm(null);
      setEditing(null);
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar el usuario");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    setSaving(true);
    setError(null);
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cambiar el estado");
    } finally {
      setSaving(false);
    }
  }

  const rows = fetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? "Administración de usuarios del sistema" : "Usuarios de tu ciudad"}
          </p>
        </div>
        <Button onClick={openCreate}>Nuevo usuario</Button>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        {fetch.loading ? (
          <Spinner label="Cargando…" />
        ) : (
          <Table
            head={
              <>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Rol</Th>
                <Th>Asignación</Th>
                <Th>Estado</Th>
                <Th></Th>
              </>
            }
          >
            {rows.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium text-slate-800">{u.fullName}</Td>
                <Td>{u.email}</Td>
                <Td><Badge tone={roleTone[u.role] ?? "slate"}>{u.role.replace("_", " ")}</Badge></Td>
                <Td>
                  {u.role === "vendedor" ? (
                    u.branch?.name ?? "—"
                  ) : u.role === "supervisor" ? (
                    u.city?.name ?? "—"
                  ) : (
                    "Global"
                  )}
                </Td>
                <Td>{u.isActive ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge>}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(u)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin usuarios</EmptyState>}
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="font-bold text-slate-800">{editing ? `Editar ${editing.fullName}` : "Nuevo usuario"}</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => { setForm(null); setEditing(null); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
              <Input value={form.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} placeholder="Nombre completo" required />
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="Correo electrónico" required />
              {!editing && (
                <Input value={form.password ?? ""} onChange={(e) => set("password", e.target.value)} placeholder="Contraseña (mín. 8, mayúscula y número)" required />
              )}
              <Select value={form.role ?? "vendedor"} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </Select>
              {form.role === "supervisor" && (
                <Select value={form.cityId ?? ""} onChange={(e) => set("cityId", e.target.value)} required>
                  <option value="">Ciudad a supervisar…</option>
                  {(cityFetch.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              )}
              {form.role === "vendedor" && (
                <Select value={form.branchId ?? ""} onChange={(e) => set("branchId", e.target.value)} required>
                  <option value="">Sucursal de venta…</option>
                  {(branchFetch.data ?? []).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              )}
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