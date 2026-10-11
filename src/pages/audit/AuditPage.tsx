import { useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { listAudit } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
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

const TYPES = [
  "User",
  "Medicine",
  "Branch",
  "City",
  "Supplier",
  "Batch",
  "InventoryItem",
  "Sale",
  "AmbientReading",
  "Prescription",
  "SanitaryRecord",
  "AdverseEventReport",
  "ElectronicInvoice",
  "StockTransfer",
  "AuditLog",
  "TransferType",
];

export function AuditPage() {
  const [entityType, setEntityType] = useState("");
  const [search, setSearch] = useState("");
  const [apply, setApply] = useState(0);

  const fetch = useFetch(
    () =>
      listAudit({
        entityType: entityType || undefined,
        limit: 100,
      }),
    [entityType, apply],
  );

  const rows = fetch.data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Auditoría del sistema</h1>
        <div className="flex items-center gap-2">
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="!w-48">
            <option value="">Todos los tipos</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrar en memoria…" className="!w-44" />
          <Button variant="secondary" size="sm" onClick={() => setApply((a) => a + 1)}>Buscar</Button>
        </div>
      </div>

      <Card>
        {fetch.loading ? (
          <Spinner label="Cargando auditoría…" />
        ) : (
          <Table
            head={
              <>
                <Th>Fecha</Th>
                <Th>Usuario</Th>
                <Th>Acción</Th>
                <Th>Entidad</Th>
                <Th>Estado</Th>
                <Th></Th>
              </>
            }
          >
            {rows
              .filter((r) => {
                const q = search.toLowerCase();
                if (!q) return true;
                return (
                  (r.userEmail ?? "").toLowerCase().includes(q) ||
                  r.path.toLowerCase().includes(q) ||
                  r.entityType.toLowerCase().includes(q)
                );
              })
              .map((r) => (
                <tr key={r.id}>
                  <Td>{formatDateTime(r.createdAt)}</Td>
                  <Td>
                    <p className="text-sm font-medium text-slate-800">{r.userEmail ?? "—"}</p>
                    <p className="text-xs text-slate-400">{r.userRole ?? ""}</p>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs">{r.method}</span>
                    <span className="ml-2 break-all text-xs text-slate-500">{r.path}</span>
                  </Td>
                  <Td>
                    <Badge tone="blue">{r.entityType}</Badge>
                    {r.entityId !== null && <span className="ml-1 text-xs text-slate-400">#{r.entityId}</span>}
                  </Td>
                  <Td>
                    {r.status < 400 ? (
                      <Badge tone="green">{r.status}</Badge>
                    ) : (
                      <Badge tone="red">{r.status}</Badge>
                    )}
                  </Td>
                  <Td>
                    {r.error && (
                      <span className="text-xs text-red-500" title={r.error}>
                        error
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
          </Table>
        )}
        {!fetch.loading && rows.length === 0 && <EmptyState>Sin registros de auditoría</EmptyState>}
        {!fetch.loading && <p className="mt-2 text-xs text-slate-400">Total: {fetch.data?.total ?? 0} eventos</p>}
      </Card>
    </div>
  );
}