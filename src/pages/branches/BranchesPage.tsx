import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { listBranches, createBranch, updateBranch, listCities, createCity } from "@/lib/api";
import { ApiError } from "@/lib/client";
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

export function BranchesPage() {
  const [tab, setTab] = useState<"sucursales" | "ciudades">("sucursales");
  const [branchForm, setBranchForm] = useState<{ name: string; address: string; cityId: string } | null>(null);
  const [cityForm, setCityForm] = useState<{ name: string; department: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const branchFetch = useFetch(() => listBranches(), []);
  const cityFetch = useFetch(() => listCities(), []);

  async function handleCreateBranch(e: FormEvent) {
    e.preventDefault();
    if (!branchForm) return;
    setSaving(true);
    setError(null);
    try {
      await createBranch({
        name: branchForm.name.trim(),
        address: branchForm.address.trim() || undefined,
        cityId: Number(branchForm.cityId),
      });
      setBranchForm(null);
      branchFetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear la sucursal");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBranch(id: number, isActive: boolean) {
    try {
      await updateBranch(id, { isActive: !isActive });
      branchFetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar");
    }
  }

  async function handleCreateCity(e: FormEvent) {
    e.preventDefault();
    if (!cityForm) return;
    setSaving(true);
    setError(null);
    try {
      await createCity({ name: cityForm.name.trim(), department: cityForm.department.trim() || undefined });
      setCityForm(null);
      cityFetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear la ciudad");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Sucursales y ciudades</h1>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "sucursales" ? "bg-white shadow-sm" : "text-slate-500"}`}
            onClick={() => setTab("sucursales")}
          >
            Sucursales
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "ciudades" ? "bg-white shadow-sm" : "text-slate-500"}`}
            onClick={() => setTab("ciudades")}
          >
            Ciudades
          </button>
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {tab === "sucursales" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => { setBranchForm({ name: "", address: "", cityId: "" }); setError(null); }}>
              Nueva sucursal
            </Button>
          </div>
          <Card>
            {branchFetch.loading ? (
              <Spinner label="Cargando…" />
            ) : (
              <Table
                head={
                  <>
                    <Th>Nombre</Th>
                    <Th>Dirección</Th>
                    <Th>Ciudad</Th>
                    <Th>Estado</Th>
                    <Th></Th>
                  </>
                }
              >
                {(branchFetch.data ?? []).map((b) => (
                  <tr key={b.id}>
                    <Td className="font-medium text-slate-800">{b.name}</Td>
                    <Td>{b.address ?? "—"}</Td>
                    <Td>{b.city?.name}</Td>
                    <Td>{b.isActive ? <Badge tone="green">Activa</Badge> : <Badge tone="slate">Inactiva</Badge>}</Td>
                    <Td>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleBranch(b.id, b.isActive)}>
                        {b.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
            {!branchFetch.loading && (branchFetch.data ?? []).length === 0 && <EmptyState>Sin sucursales</EmptyState>}
          </Card>
        </>
      )}

      {tab === "ciudades" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => { setCityForm({ name: "", department: "" }); setError(null); }}>
              Nueva ciudad
            </Button>
          </div>
          <Card>
            {cityFetch.loading ? (
              <Spinner label="Cargando…" />
            ) : (
              <Table
                head={
                  <>
                    <Th>Ciudad</Th>
                    <Th>Departamento</Th>
                    <Th className="text-right">Sucursales</Th>
                  </>
                }
              >
                {(cityFetch.data ?? []).map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium text-slate-800">{c.name}</Td>
                    <Td>{c.department}</Td>
                    <Td className="text-right">
                      {(branchFetch.data ?? []).filter((b) => b.cityId === c.id).length}
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
            {!cityFetch.loading && (cityFetch.data ?? []).length === 0 && <EmptyState>Sin ciudades</EmptyState>}
          </Card>
        </>
      )}

      {branchForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-3 font-bold text-slate-800">Nueva sucursal</h3>
            <form onSubmit={handleCreateBranch} className="space-y-3">
              <Input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="Nombre (MiSalud Cali Centro)" required />
              <Input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Dirección (opcional)" />
              <Select value={branchForm.cityId} onChange={(e) => setBranchForm({ ...branchForm, cityId: e.target.value })} required>
                <option value="">Ciudad…</option>
                {(cityFetch.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setBranchForm(null)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cityForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-3 font-bold text-slate-800">Nueva ciudad</h3>
            <form onSubmit={handleCreateCity} className="space-y-3">
              <Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} placeholder="Ciudad" required />
              <Input value={cityForm.department} onChange={(e) => setCityForm({ ...cityForm, department: e.target.value })} placeholder="Departamento (opcional)" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCityForm(null)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}