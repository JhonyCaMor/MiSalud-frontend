import { useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listSales, listBranches, getSale } from "@/lib/api";
import { formatCOP, formatDateTime } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Spinner,
  Table,
  Td,
  Th,
} from "@/components/ui";
import type { Sale } from "@/lib/contracts";

export function SalesPage() {
  const { user } = useAuth();
  const isVendedor = user?.role === "vendedor";
  const myBranchId = isVendedor ? user?.branchId : undefined;

  const [branchId, setBranchId] = useState<string>(myBranchId ? String(myBranchId) : "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<Sale | null>(null);

  const salesFetch = useFetch<Sale[]>(
    () => listSales(branchId || undefined, from || undefined, to || undefined),
    [branchId, from, to],
  );
  const branchFetch = useFetch(() => listBranches(), []);

  const sales = salesFetch.data ?? [];

  async function fetchDetail(id: number) {
    const sale = await getSale(id);
    setDetail(sale);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Ventas</h1>
        <div className="flex flex-wrap items-center gap-2">
          {!isVendedor && (
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="!w-48">
              <option value="">Todas las sucursales</option>
              {(branchFetch.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <Button variant="secondary" size="sm" onClick={() => salesFetch.reload()}>
            Aplicar
          </Button>
        </div>
      </div>

      <Card>
        {salesFetch.loading ? (
          <Spinner label="Cargando ventas…" />
        ) : (
          <Table
            head={
              <>
                <Th>#</Th>
                <Th>Fecha</Th>
                <Th>Sucursal</Th>
                <Th>Vendedor</Th>
                <Th>Cliente</Th>
                <Th className="text-right">Total</Th>
                <Th></Th>
              </>
            }
          >
            {sales.map((s) => (
              <tr key={s.id}>
                <Td className="font-mono text-xs">#{s.id}</Td>
                <Td>{formatDateTime(s.createdAt)}</Td>
                <Td>{s.branch?.name ?? `Sucursal ${s.branchId}`}</Td>
                <Td>{s.seller?.fullName ?? s.sellerId}</Td>
                <Td>{s.customerName ?? "Consumidor final"}</Td>
                <Td className="text-right font-semibold">{formatCOP(s.total)}</Td>
                <Td>
                  <Button variant="ghost" size="sm" onClick={() => fetchDetail(s.id)}>
                    Ver detalle
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!salesFetch.loading && sales.length === 0 && <EmptyState>Sin ventas con esos filtros</EmptyState>}
      </Card>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="font-bold text-slate-800">Venta #{detail.id}</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setDetail(null)}>
                ✕
              </button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha</span>
                <span className="font-medium">{formatDateTime(detail.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sucursal</span>
                <span className="font-medium">{detail.branch?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vendedor</span>
                <span className="font-medium">{detail.seller?.fullName ?? detail.sellerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente</span>
                <span className="font-medium">{detail.customerName ?? "Consumidor final"}</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-right">P. unit</th>
                      <th className="px-3 py-2 text-right">Subt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(detail.items ?? []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.medicine?.name}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCOP(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCOP(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <Badge tone="green">{detail.status}</Badge>
                <p className="text-lg font-bold text-brand-700">{formatCOP(detail.total)}</p>
              </div>
            </div>
            <div className="px-5 py-3">
              <Button className="w-full" onClick={() => setDetail(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}