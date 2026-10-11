import { useMemo, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import {
  listSales,
  listInventory,
  listBranches,
  listReadings,
  listBatches,
} from "@/lib/api";
import { formatCOP, formatDate } from "@/lib/format";
import {
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Select,
  Spinner,
  StatCard,
  Table,
  Td,
  Th,
  EmptyState,
} from "@/components/ui";
import type { Sale } from "@/lib/contracts";

function SortableBars({
  data,
  formatter,
}: {
  data: { label: string; value: number }[];
  formatter: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <div className="space-y-2">
      {sorted.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-40 truncate text-xs text-slate-600">{d.label}</span>
          <div className="flex-1">
            <div className="h-5 rounded bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded bg-brand-500 transition-all"
                style={{ width: `${(d.value / max) * 100}%` }}
                title={formatter(d.value)}
              />
            </div>
          </div>
          <span className="w-24 text-right text-xs font-semibold text-slate-700">
            {formatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const canSeeAll = user?.role !== "vendedor";

  const [branchId, setBranchId] = useState<string>("");

  const salesFetch = useFetch<Sale[]>(
    () => listSales(branchId || undefined),
    [branchId],
  );
  const invFetch = useFetch(() => listInventory(branchId || undefined), [branchId]);
  const branchFetch = useFetch(() => listBranches(), []);
  const readFetch = useFetch(() => listReadings(branchId || undefined), [branchId]);
  const batchFetch = useFetch(() => listBatches(branchId || undefined), [branchId]);

  const sales = salesFetch.data ?? [];
  const inventory = invFetch.data ?? [];
  const readings = readFetch.data ?? [];

  const stats = useMemo(() => {
    const now = new Date();
    const today = sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d.toDateString() === now.toDateString();
    });
    const totalToday = today.reduce((s, sale) => s + sale.total, 0);
    const totalAll = sales.reduce((s, sale) => s + sale.total, 0);
    const lowStock = inventory.filter((i) => i.quantityAvailable <= 10).length;
    return {
      todayCount: today.length,
      todayTotal: totalToday,
      allTotal: totalAll,
      lowStock,
    };
  }, [sales, inventory]);

  const byBranch = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) {
      const name = s.branch?.name ?? `Sucursal ${s.branchId}`;
      map.set(name, (map.get(name) ?? 0) + s.total);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [sales]);

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) {
      const key = new Date(s.createdAt).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      });
      map.set(key, (map.get(key) ?? 0) + s.total);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-14);
  }, [sales]);

  const expiringSoon = useMemo(() => {
    return (batchFetch.data ?? [])
      .filter((b) => new Date(b.expirationDate).getTime() < Date.now() + 90 * 86_400_000)
      .sort(
        (a, b) =>
          new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime(),
      )
      .slice(0, 6);
  }, [batchFetch.data]);

  if (!canSeeAll) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-slate-800">Mi sucursal</h1>
        <Grid>
          <StatCard label="Ventas hoy" value={stats.todayCount} hint="Transacciones registradas" />
          <StatCard label="Ventas (todas)" value={stats.allTotal > 0 ? formatCOP(stats.allTotal) : "$0"} tone="green" />
          <StatCard label="Productos con stock bajo" value={stats.lowStock} tone="amber" />
          <StatCard label="Lecturas de temperatura" value={readings.length} tone="brand" />
        </Grid>
        <Card title="Mis ventas recientes">
          {sales.length ? (
            <Table head={<><Th>#</Th><Th>Fecha</Th><Th>Cliente</Th><Th className="text-right">Total</Th></>}>
              {sales.slice(0, 10).map((s) => (
                <tr key={s.id}>
                  <Td>#{s.id}</Td>
                  <Td>{formatDate(s.createdAt)}</Td>
                  <Td>{s.customerName ?? "Consumidor final"}</Td>
                  <Td className="text-right font-semibold">{formatCOP(s.total)}</Td>
                </tr>
              ))}
            </Table>
          ) : salesFetch.loading ? (
            <Spinner />
          ) : (
            <EmptyState>Sin ventas registradas</EmptyState>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Tablero de control</h1>
        <div className="w-56">
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Todas las sucursales</option>
            {(branchFetch.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Grid>
        <StatCard label="Ventas hoy" value={stats.todayCount} hint="Transacciones" />
        <StatCard label="Ventas del día" value={formatCOP(stats.todayTotal)} tone="green" />
        <StatCard label="Ventas acumuladas" value={formatCOP(stats.allTotal)} tone="brand" />
        <StatCard label="Stock bajo (≤10)" value={stats.lowStock} tone="amber" />
      </Grid>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Ventas por sucursal">
          {salesFetch.loading ? (
            <Spinner />
          ) : byBranch.length ? (
            <SortableBars data={byBranch} formatter={(v) => formatCOP(v)} />
          ) : (
            <EmptyState>Sin ventas en el rango seleccionado</EmptyState>
          )}
        </Card>
        <Card title="Ventas por día (últimas)">
          {salesFetch.loading ? (
            <Spinner />
          ) : byDate.length ? (
            <SortableBars data={byDate} formatter={(v) => formatCOP(v)} />
          ) : (
            <EmptyState>Sin ventas para graficar</EmptyState>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card
          title="Productos con stock bajo"
          action={invFetch.loading ? undefined : <Button variant="ghost" size="sm" onClick={() => invFetch.reload()}>Actualizar</Button>}
        >
          {invFetch.loading ? (
            <Spinner />
          ) : (
            <Table
              head={
                <>
                  <Th>Producto</Th>
                  <Th>Sucursal</Th>
                  <Th className="text-right">Disponible</Th>
                </>
              }
            >
              {inventory
                .filter((i) => i.quantityAvailable <= 10)
                .sort((a, b) => a.quantityAvailable - b.quantityAvailable)
                .slice(0, 8)
                .map((i) => (
                  <tr key={i.id}>
                    <Td>
                      <p className="font-medium text-slate-800">{i.medicine?.name}</p>
                      <p className="text-xs text-slate-400">{i.medicine?.code}</p>
                    </Td>
                    <Td>{i.branch?.name}</Td>
                    <Td className="text-right">
                      <Badge tone={i.quantityAvailable <= 3 ? "red" : "amber"}>
                        {i.quantityAvailable} uds
                      </Badge>
                    </Td>
                  </tr>
                ))}
            </Table>
          )}
        </Card>

        <Card title="Alertas de temperatura">
          {readFetch.loading ? (
            <Spinner />
          ) : readings.length ? (
            <Table
              head={
                <>
                  <Th>Fecha</Th>
                  <Th>Zona</Th>
                  <Th className="text-right">Temp</Th>
                  <Th className="text-right">Humedad</Th>
                  <Th>Estado</Th>
                </>
              }
            >
              {readings.slice(0, 6).map((r) => (
                <tr key={r.id}>
                  <Td>{formatDate(r.recordedAt)}</Td>
                  <Td className="capitalize">{r.zone}</Td>
                  <Td className="text-right">{r.temperature} °C</Td>
                  <Td className="text-right">{r.humidity}%</Td>
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
          ) : (
            <EmptyState>Sin lecturas registradas</EmptyState>
          )}
        </Card>
      </div>

      <Card title="Lotes por vencer (90 días)">
        {expiringSoon.length ? (
          <Table
            head={
              <>
                <Th>Lote</Th>
                <Th>Producto</Th>
                <Th>Sucursal</Th>
                <Th className="text-right">Vence</Th>
              </>
            }
          >
            {expiringSoon.map((b) => (
              <tr key={b.id}>
                <Td className="font-mono text-xs">{b.code}</Td>
                <Td>{b.medicine?.name}</Td>
                <Td>{b.branch?.name}</Td>
                <Td className="text-right">
                  <Badge tone="red">{formatDate(b.expirationDate)}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        ) : batchFetch.loading ? (
          <Spinner />
        ) : (
          <EmptyState>No hay lotes por vencer</EmptyState>
        )}
      </Card>

      {salesFetch.error || invFetch.error || readFetch.error || batchFetch.error ? (
        <Alert tone="danger">
          {salesFetch.error ?? invFetch.error ?? readFetch.error ?? batchFetch.error}
        </Alert>
      ) : null}
    </div>
  );
}