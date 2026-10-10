import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RequireRole } from "@/components/RequireRole";
import { Spinner } from "@/components/ui";

const PosPage = lazy(() => import("@/pages/PosPage").then((m) => ({ default: m.PosPage })));
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const SalesPage = lazy(() => import("@/pages/SalesPage").then((m) => ({ default: m.SalesPage })));
const InventoryPage = lazy(() => import("@/pages/InventoryPage").then((m) => ({ default: m.InventoryPage })));
const MedicinesPage = lazy(() => import("@/pages/MedicinesPage").then((m) => ({ default: m.MedicinesPage })));
const BatchesPage = lazy(() => import("@/pages/BatchesPage").then((m) => ({ default: m.BatchesPage })));
const TemperaturePage = lazy(() => import("@/pages/TemperaturePage").then((m) => ({ default: m.TemperaturePage })));
const PrescriptionsPage = lazy(() => import("@/pages/PrescriptionsPage").then((m) => ({ default: m.PrescriptionsPage })));
const PharmacovigilancePage = lazy(() =>
  import("@/pages/PharmacovigilancePage").then((m) => ({ default: m.PharmacovigilancePage })),
);
const InvoicingPage = lazy(() => import("@/pages/InvoicingPage").then((m) => ({ default: m.InvoicingPage })));
const TransfersPage = lazy(() => import("@/pages/TransfersPage").then((m) => ({ default: m.TransfersPage })));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage").then((m) => ({ default: m.SuppliersPage })));
const UsersPage = lazy(() => import("@/pages/UsersPage").then((m) => ({ default: m.UsersPage })));
const BranchesPage = lazy(() => import("@/pages/BranchesPage").then((m) => ({ default: m.BranchesPage })));
const InvimaPage = lazy(() => import("@/pages/InvimaPage").then((m) => ({ default: m.InvimaPage })));
const AuditPage = lazy(() => import("@/pages/AuditPage").then((m) => ({ default: m.AuditPage })));

const MANAGERS = ["super_admin", "supervisor"] as const;

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-10"><Spinner label="Cargando módulo…" /></div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireRole />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/medicines" element={<RequireRole roles={[...MANAGERS]}><MedicinesPage /></RequireRole>} />
              <Route path="/batches" element={<RequireRole roles={[...MANAGERS]}><BatchesPage /></RequireRole>} />
              <Route path="/temperature" element={<TemperaturePage />} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/pharmacovigilance" element={<PharmacovigilancePage />} />
              <Route path="/invoicing" element={<RequireRole roles={[...MANAGERS]}><InvoicingPage /></RequireRole>} />
              <Route path="/transfers" element={<RequireRole roles={[...MANAGERS]}><TransfersPage /></RequireRole>} />
              <Route path="/suppliers" element={<RequireRole roles={[...MANAGERS]}><SuppliersPage /></RequireRole>} />
              <Route path="/users" element={<RequireRole roles={[...MANAGERS]}><UsersPage /></RequireRole>} />
              <Route path="/branches" element={<RequireRole roles={["super_admin"]}><BranchesPage /></RequireRole>} />
              <Route path="/invima" element={<InvimaPage />} />
              <Route path="/audit" element={<RequireRole roles={["super_admin"]}><AuditPage /></RequireRole>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}