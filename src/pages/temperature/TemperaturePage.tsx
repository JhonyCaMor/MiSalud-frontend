import { useState, type FormEvent } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listReadings, createReading, listBranches } from "@/lib/api";
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

export function TemperaturePage() {
  const { user } = useAuth();
  const isVendedor = user?.role === "vendedor";
  const [branchId, setBranchId] = useState<string>(
    isVendedor ? String(user?.branchId ?? "") : "",
  );
  const [zone, setZone] = useState("ambiente");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetch = useFetch(() => listReadings(branchId || undefined), [branchId]);
  const branchFetch = useFetch(() => listBranches(), []);

  const rows = fetch.data ?? [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createReading({
        branchId: branchId ? Number(branchId) : undefined,
        zone: zone as "ambiente" | "refrigerado",
        temperature: Number(temperature),
        humidity: Number(humidity),
        notes: notes.trim() || undefined,
      });
      setTemperature("");
      setHumidity("");
      setNotes("");
      fetch.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar la lectura");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Control de temperatura y humedad</h1>
      <p className="text-sm text-slate-500">
        Lecturas periódicas exigidas por la Resolución 1403/2005. Rango refrigerado: 2–8 °C ·
        ambiente: 15–25 °C y HR 30–70%.
      </p>

      <Card title="Registrar lectura">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {!isVendedor && (
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
              <option value="">Sucursal…</option>
              {(branchFetch.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          )}
          <Select value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="ambiente">Ambiente</option>
            <option value="refrigerado">Refrigerado</option>
          </Select>
          <Input type="number" step={0.1} min={-30} max={80} value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="Temp °C" required />
          <Input type="number" step={0.1} min={0} max={100} value={humidity} onChange={(e) => setHumidity(e.target.value)} placeholder="Humedad %" required />
          <div className="flex items-center gap-2">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" />
            <Button type="submit" disabled={saving}>{saving ? "…" : "Guardar"}</Button>
          </div>
        </form>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}

      <Card title="Historial de lecturas">
        {fetch.loading ? (
          <Spinner label="Cargando lecturas…" />
        ) : (
          <Table
            head={
              <>
                <Th>Fecha</Th>
                <Th>Sucursal</Th>
                <Th>Zona</Th>
                <Th className="text-right">Temp °C</Th>
                <Th className="text-right">Humedad %</Th>
                <Th>Estado</Th>
              </>
            }
          >
            {rows.slice(0, 30).map((r) => (
              <tr key={r.id}>
                <Td>{formatDateTime(r.recordedAt)}</Td>
                <Td>{r.branch?.name}</Td>
                <Td className="capitalize">{r.zone}</Td>
                <Td className="text-right">{r.temperature}</Td>
                <Td className="text-right">{r.humidity}</Td>
                <Td>
                  {r.inRange ? (
                    <Badge tone="green">En rango</Badge>
                  ) : (
                    <Badge tone="red">Fuera de rango</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin lecturas registradas</EmptyState>}
      </Card>
    </div>
  );
}