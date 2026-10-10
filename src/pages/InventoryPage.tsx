import { useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "@/context/AuthContext";
import { listInventory, listBranches } from "@/lib/api";
import {
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

export function InventoryPage() {
  const { user } = useAuth();
  const isVendedor = user?.role === "vendedor";
  const [branchId, setBranchId] = useState<string>(
    isVendedor ? String(user?.branchId ?? "") : "",
  );
  const [search, setSearch] = useState("");
  const [apply, setApply] = useState(0);

  const invFetch = useFetch(
    () => listInventory(branchId || undefined, search),
    [branchId, search, apply],
  );
  const branchFetch = useFetch(() => listBranches(), []);

  const rows = invFetch.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Inventario</h1>
        <div className="flex items-center gap-2">
          {!isVendedor && (
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="!w-52">
              <option value="">Todas las sucursales</option>
              {(branchFetch.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="!w-56"
          />
          <Button variant="secondary" size="sm" onClick={() => setApply((a) => a + 1)}>
            Buscar
          </Button>
        </div>
      </div>

      <Card>
        {invFetch.loading ? (
          <Spinner label="Cargando inventario…" />
        ) : (
          <Table
            head={
              <>
                <Th>Código</Th>
                <Th>Producto</Th>
                <Th>Sucursal</Th>
                <Th className="text-right">Disponible</Th>
              </>
            }
          >
            {rows.map((i) => (
              <tr key={i.id}>
                <Td className="font-mono text-xs">{i.medicine?.code}</Td>
                <Td>
                  <p className="font-medium text-slate-800">{i.medicine?.name}</p>
                  <p className="text-xs text-slate-400">{i.medicine?.presentation}</p>
                </Td>
                <Td>{i.branch?.name}</Td>
                <Td className="text-right">
                  <Badge tone={i.quantityAvailable <= 3 ? "red" : i.quantityAvailable <= 10 ? "amber" : "green"}>
                    {i.quantityAvailable} uds
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {!invFetch.loading && rows.length === 0 && <EmptyState>Sin productos en inventario</EmptyState>}
      </Card>
    </div>
  );
}