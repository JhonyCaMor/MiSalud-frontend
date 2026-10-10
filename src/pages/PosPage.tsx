import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/client";
import { listInventory, createSale, listBatches, createPrescription } from "@/lib/api";
import type { InventoryItem } from "@/lib/contracts";
import { daysUntil, formatCOP } from "@/lib/format";
import { sanitizeField, isValidPrescriptionNumber } from "@/lib/security";
import { useIncrementalList } from "@/lib/useIncrementalList";
import {
  Alert,
  Badge,
  Button,
  Card,
  cn,
  EmptyState,
  Input,
  Spinner,
  Table,
  Td,
  Th,
} from "@/components/ui";

interface CartLine {
  medicineId: number;
  name: string;
  code: string;
  unitPrice: number;
  quantity: number;
  requiresPrescription: boolean;
}

/* Fila de catálogo memoizada: solo se re-renderiza si cambian sus props
   (stock, pertenencia al carrito o flag de "recién agregado"). */
const ProductRow = memo(function ProductRow({
  item,
  expDays,
  inCart,
  justAdded,
  onAdd,
}: {
  item: InventoryItem;
  expDays: number | null;
  inCart: boolean;
  justAdded: boolean;
  onAdd: (item: InventoryItem) => void;
}) {
  const med = item.medicine;
  const out = (item.quantityAvailable ?? 0) <= 0;
  return (
    <tr
      className={cn(
        "transition-colors",
        justAdded && "animate-flash-row",
        inCart && !justAdded && "bg-brand-50/70",
      )}
    >
      <Td className="font-mono text-xs">{med?.code}</Td>
      <Td>
        <p className="font-medium text-slate-800">{med?.name}</p>
        <p className="text-xs text-slate-400">{med?.presentation}</p>
        {med?.requiresPrescription && (
          <Badge tone="amber" className="mt-1">Requiere fórmula</Badge>
        )}
        {expDays !== null && expDays <= 90 && (
          <Badge tone="red" className="mt-1">
            Vence en {Math.max(0, expDays)} días (FEFO)
          </Badge>
        )}
      </Td>
      <Td className="text-right font-semibold">{item.quantityAvailable}</Td>
      <Td>
        <Button
          type="button"
          size="sm"
          variant={justAdded ? "success" : inCart ? "secondary" : "primary"}
          disabled={out}
          aria-label={`Agregar ${med?.name ?? "producto"} al carrito`}
          onClick={() => onAdd(item)}
          className={justAdded ? "animate-pop" : undefined}
        >
          {justAdded ? "✓ Agregado" : "Agregar"}
        </Button>
      </Td>
    </tr>
  );
});

const CartLineRow = memo(function CartLineRow({
  line,
  max,
  onQty,
  onPrice,
  onRemove,
}: {
  line: CartLine;
  max: number;
  onQty: (medicineId: number, quantity: number) => void;
  onPrice: (medicineId: number, unitPrice: number) => void;
  onRemove: (medicineId: number) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{line.name}</p>
        <button
          type="button"
          onClick={() => onRemove(line.medicineId)}
          className="text-xs text-danger-500 hover:text-danger-700"
          aria-label={`Quitar ${line.name}`}
        >
          Quitar
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex items-center">
          <Button type="button" variant="secondary" className="!px-2 !py-1" onClick={() => onQty(line.medicineId, line.quantity - 1)} aria-label="Restar una unidad">−</Button>
          <span className="w-9 text-center text-sm font-bold" aria-live="polite">{line.quantity}</span>
          <Button type="button" variant="secondary" className="!px-2 !py-1" onClick={() => onQty(line.medicineId, line.quantity + 1)} aria-label="Sumar una unidad">+</Button>
        </div>
        <input
          type="number"
          min={0}
          step="0.01"
          value={line.unitPrice}
          onChange={(e) => onPrice(line.medicineId, Number(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          placeholder="Precio"
          aria-label={`Precio unitario de ${line.name}`}
        />
        <span className="whitespace-nowrap text-xs text-slate-400">máx {max}</span>
      </div>
      <p className="mt-1 text-right text-sm font-bold text-brand-700">
        {formatCOP(line.quantity * line.unitPrice)}
      </p>
    </div>
  );
});

export function PosPage() {
  const { user } = useAuth();
  const branchId = user?.branchId ?? undefined;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suggestedPrices, setSuggestedPrices] = useState<Record<number, number>>({});
  const [expiryByMed, setExpiryByMed] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState("");
  const [prescriptionNo, setPrescriptionNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [lastTotal, setLastTotal] = useState(0);
  const [open, setOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, batchList] = await Promise.all([
        listInventory(branchId),
        listBatches(branchId),
      ]);
      setInventory(inv);
      const prices: Record<number, number> = {};
      const expiry = new Map<number, number>();
      for (const b of batchList) {
        if (prices[b.medicineId] === undefined && b.unitCost > 0) {
          prices[b.medicineId] = Math.round(b.unitCost * 1.3);
        }
        if (b.quantityRemaining > 0) {
          const d = daysUntil(b.expirationDate);
          if (d !== null) {
            const cur = expiry.get(b.medicineId);
            if (cur === undefined || d < cur) expiry.set(b.medicineId, d);
          }
        }
      }
      setSuggestedPrices(prices);
      setExpiryByMed(expiry);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error cargando inventario");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (item) =>
        item.medicine?.name.toLowerCase().includes(q) ||
        item.medicine?.code.toLowerCase().includes(q) ||
        item.medicine?.activeIngredient.toLowerCase().includes(q),
    );
  }, [inventory, search]);

  const { visibleItems, hasMore, loadMore } = useIncrementalList(
    filtered,
    24,
    search,
  );

  const cartIds = useMemo(() => new Set(cart.map((l) => l.medicineId)), [cart]);
  const stockByMed = useMemo(
    () => new Map(inventory.map((i) => [i.medicineId, i.quantityAvailable])),
    [inventory],
  );

  const flash = useCallback((medicineId: number) => {
    setJustAdded(medicineId);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setJustAdded(null), 900);
  }, []);

  const addToCart = useCallback(
    (item: InventoryItem) => {
      const med = item.medicine;
      if (!med) return;
      setCart((prev) => {
        const existing = prev.find((l) => l.medicineId === med.id);
        if (existing) {
          return prev.map((l) =>
            l.medicineId === med.id
              ? { ...l, quantity: Math.min(item.quantityAvailable, l.quantity + 1) }
              : l,
          );
        }
        return [
          ...prev,
          {
            medicineId: med.id,
            name: med.name,
            code: med.code,
            unitPrice: suggestedPrices[med.id] ?? 0,
            quantity: 1,
            requiresPrescription: med.requiresPrescription,
          },
        ];
      });
      flash(med.id);
    },
    [suggestedPrices, flash],
  );

  const removeLine = useCallback((medicineId: number) => {
    setCart((prev) => prev.filter((l) => l.medicineId !== medicineId));
  }, []);

  const setQty = useCallback(
    (medicineId: number, quantity: number) => {
      const max = stockByMed.get(medicineId) ?? 99;
      setCart((prev) =>
        prev.map((l) =>
          l.medicineId === medicineId
            ? { ...l, quantity: Math.max(1, Math.min(max, quantity)) }
            : l,
        ),
      );
    },
    [stockByMed],
  );

  const setPrice = useCallback((medicineId: number, unitPrice: number) => {
    setCart((prev) =>
      prev.map((l) => (l.medicineId === medicineId ? { ...l, unitPrice } : l)),
    );
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
    [cart],
  );

  const pendingPrescription = useMemo(
    () => cart.find((l) => l.requiresPrescription) ?? null,
    [cart],
  );

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0 || submitting) return;
    setError(null);

    if (pendingPrescription) {
      if (!isValidPrescriptionNumber(prescriptionNo)) {
        setError(
          `La venta incluye "${pendingPrescription.name}": registra un número de fórmula válido (letras, números y guiones).`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      if (pendingPrescription) {
        await createPrescription({
          prescriptionNumber: prescriptionNo.trim(),
          doctorName: "Fórmula del cliente",
          doctorLicense: "N/A",
          patientName: customer || "Consumidor final",
          patientDocument: "0000000000",
          branchId,
          notes: "Generada automáticamente desde el punto de venta",
        });
      }
      const sale = await createSale({
        customerName: customer || undefined,
        items: cart.map((l) => ({
          medicineId: l.medicineId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      setLastSaleId(sale.id);
      setLastTotal(sale.total);
      setOpen(true);
      setCart([]);
      setCustomer("");
      setPrescriptionNo("");
      void load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar la venta");
    } finally {
      setSubmitting(false);
    }
  }, [cart, submitting, pendingPrescription, prescriptionNo, customer, branchId, load]);

  // Atajos de teclado: F2 buscar · Enter agregar primer resultado · F9 registrar venta
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === "F9") {
        e.preventDefault();
        void handleCheckout();
      } else if (e.key === "Enter") {
        if (document.activeElement === searchRef.current && filtered.length > 0) {
          e.preventDefault();
          addToCart(filtered[0]);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, addToCart, handleCheckout]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Punto de venta</h1>
          <p className="text-sm text-slate-500">{user?.branch?.name ?? "Mi sucursal"}</p>
        </div>
        <p className="text-xs text-slate-400">
          Atajos: <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono">F2</kbd> buscar ·{" "}
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono">Enter</kbd> agregar ·{" "}
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono">F9</kbd> registrar
        </p>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card title="Buscar producto" className="mb-4">
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, código o principio activo… (F2)"
              autoFocus
              aria-label="Buscar producto"
            />
          </Card>

          {loading ? (
            <Card><Spinner label="Cargando inventario…" /></Card>
          ) : (
            <Card>
              <Table
                head={
                  <>
                    <Th>Código</Th>
                    <Th>Producto</Th>
                    <Th className="text-right">Disponible</Th>
                    <Th></Th>
                  </>
                }
              >
                {visibleItems.map((item) => (
                  <ProductRow
                    key={item.id}
                    item={item}
                    expDays={expiryByMed.get(item.medicineId) ?? null}
                    inCart={cartIds.has(item.medicineId)}
                    justAdded={justAdded === item.medicineId}
                    onAdd={addToCart}
                  />
                ))}
              </Table>
              {filtered.length === 0 && <EmptyState>No se encontraron productos</EmptyState>}
              {hasMore && (
                <div className="mt-3 text-center">
                  <Button variant="secondary" onClick={loadMore}>
                    Mostrar más ({filtered.length - visibleItems.length} restantes)
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card title="Venta actual">
            {cart.length === 0 ? (
              <EmptyState>Agrega productos para iniciar la venta</EmptyState>
            ) : (
              <div className="space-y-3">
                {cart.map((line) => (
                  <CartLineRow
                    key={line.medicineId}
                    line={line}
                    max={stockByMed.get(line.medicineId) ?? 99}
                    onQty={setQty}
                    onPrice={setPrice}
                    onRemove={removeLine}
                  />
                ))}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="pos-customer">
                    Nombre del cliente (opcional)
                  </label>
                  <Input
                    id="pos-customer"
                    value={customer}
                    maxLength={80}
                    onChange={(e) => setCustomer(sanitizeField(e.target.value, 80))}
                    placeholder="Consumidor final"
                  />
                </div>

                {pendingPrescription && (
                  <div className="rounded-lg border border-alert-200 bg-alert-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-alert-800">
                      {pendingPrescription.name} requiere fórmula médica
                    </p>
                    <Input
                      value={prescriptionNo}
                      maxLength={30}
                      onChange={(e) => setPrescriptionNo(e.target.value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 30))}
                      placeholder="Número de fórmula, ej. FM-2026-001"
                      aria-label="Número de fórmula médica"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <p className="text-sm font-semibold text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-brand-700">{formatCOP(total)}</p>
                </div>

                <Button
                  className="w-full"
                  variant="success"
                  loading={submitting}
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  {submitting ? "Registrando…" : "Registrar venta (F9)"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pharma-100 text-2xl text-pharma-700">
              ✓
            </div>
            <h2 className="text-lg font-bold text-slate-800">Venta registrada</h2>
            <p className="mt-1 text-sm text-slate-500">
              Venta #{lastSaleId} por <strong>{formatCOP(lastTotal)}</strong>
            </p>
            <Button className="mt-4 w-full" onClick={() => setOpen(false)}>
              Nueva venta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}