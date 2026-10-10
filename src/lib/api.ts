import { api } from "@/lib/client";
import type {
  AmbientReading,
  AdverseEventReport,
  AuditListResponse,
  Batch,
  Branch,
  City,
  CreateAdverseEventReportDto,
  CreateAmbientReadingDto,
  CreateBatchDto,
  CreateBranchDto,
  CreateCityDto,
  CreateElectronicInvoiceDto,
  CreateMedicineDto,
  CreatePrescriptionDto,
  CreateSanitaryRecordDto,
  CreateSupplierDto,
  CreateTransferDto,
  CreateUserDto,
  ElectronicInvoice,
  InventoryItem,
  Medicine,
  Prescription,
  SanitaryRecord,
  Sale,
  StockTransfer,
  Supplier,
  UpdateInvoiceStatusDto,
  UpdatePrescriptionStatusDto,
  UpdateReportStatusDto,
  UpdateTransferStatusDto,
  User,
} from "@/lib/contracts";

// ---------- Catálogos ----------
export const listCities = () => api.get<City[]>("/cities");
export const createCity = (dto: CreateCityDto) => api.post<City>("/cities", dto);

export const listBranches = () => api.get<Branch[]>("/branches");
export const createBranch = (dto: CreateBranchDto) => api.post<Branch>("/branches", dto);
export const updateBranch = (id: number, dto: Partial<CreateBranchDto> & { isActive?: boolean }) =>
  api.patch<Branch>(`/branches/${id}`, dto);

export const listSuppliers = () => api.get<Supplier[]>("/suppliers");
export const createSupplier = (dto: CreateSupplierDto) =>
  api.post<Supplier>("/suppliers", dto);
export const updateSupplier = (id: number, dto: Partial<CreateSupplierDto>) =>
  api.patch<Supplier>(`/suppliers/${id}`, dto);
export const deleteSupplier = (id: number) => api.del<Supplier>(`/suppliers/${id}`);

// ---------- Medicamentos / Lotes / Inventario ----------
export function listMedicines(search = "", category = "") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const qs = params.toString();
  return api.get<Medicine[]>(`/medicines${qs ? `?${qs}` : ""}`);
}

export const createMedicine = (dto: CreateMedicineDto) =>
  api.post<Medicine>("/medicines", dto);
export const updateMedicine = (id: number, dto: Partial<CreateMedicineDto>) =>
  api.patch<Medicine>(`/medicines/${id}`, dto);
export const deleteMedicine = (id: number) => api.del<Medicine>(`/medicines/${id}`);

export function listBatches(branchId?: string | number, medicineId?: number) {
  const params = new URLSearchParams();
  if (branchId) params.set("branchId", String(branchId));
  if (medicineId) params.set("medicineId", String(medicineId));
  const qs = params.toString();
  return api.get<Batch[]>(`/batches${qs ? `?${qs}` : ""}`);
}

export const createBatch = (dto: CreateBatchDto) => api.post<Batch>("/batches", dto);

export function listInventory(branchId?: string | number, search = "") {
  const params = new URLSearchParams();
  if (branchId) params.set("branchId", String(branchId));
  if (search) params.set("search", search);
  const qs = params.toString();
  return api.get<InventoryItem[]>(`/inventory${qs ? `?${qs}` : ""}`);
}

// ---------- Ventas ----------
export function listSales(branchId?: string | number, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (branchId) params.set("branchId", String(branchId));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return api.get<Sale[]>(`/sales${qs ? `?${qs}` : ""}`);
}

export const getSale = (id: number) => api.get<Sale>(`/sales/${id}`);
export const createSale = (dto: { customerName?: string; items: { medicineId: number; quantity: number; unitPrice: number }[] }) =>
  api.post<Sale>("/sales", dto);

// ---------- Temperatura ----------
export function listReadings(branchId?: string | number) {
  const params = new URLSearchParams();
  if (branchId) params.set("branchId", String(branchId));
  const qs = params.toString();
  return api.get<AmbientReading[]>(`/temperatura-humidity${qs ? `?${qs}` : ""}`);
}

export const createReading = (dto: CreateAmbientReadingDto) =>
  api.post<AmbientReading>("/temperatura-humidity", dto);

// ---------- Prescripciones ----------
export const listPrescriptions = () => api.get<Prescription[]>("/prescripciones");
export const createPrescription = (dto: CreatePrescriptionDto) =>
  api.post<Prescription>("/prescripciones", dto);
export const updatePrescriptionStatus = (id: number, dto: UpdatePrescriptionStatusDto) =>
  api.patch<Prescription>(`/prescripciones/${id}/status`, dto);

// ---------- INVIMA ----------
export const listSanitaryRecords = () => api.get<SanitaryRecord[]>("/invima-sanitary");
export const createSanitaryRecord = (dto: CreateSanitaryRecordDto) =>
  api.post<SanitaryRecord>("/invima-sanitary", dto);

// ---------- Farmacovigilancia ----------
export const listReports = () => api.get<AdverseEventReport[]>("/pharmacovigilance");
export const createReport = (dto: CreateAdverseEventReportDto) =>
  api.post<AdverseEventReport>("/pharmacovigilance", dto);
export const updateReportStatus = (id: number, dto: UpdateReportStatusDto) =>
  api.patch<AdverseEventReport>(`/pharmacovigilance/${id}/status`, dto);

// ---------- Facturación electrónica ----------
export const listInvoices = () => api.get<ElectronicInvoice[]>("/electronic-invoicing");
export const createInvoice = (dto: CreateElectronicInvoiceDto) =>
  api.post<ElectronicInvoice>("/electronic-invoicing", dto);
export const updateInvoiceStatus = (id: number, dto: UpdateInvoiceStatusDto) =>
  api.patch<ElectronicInvoice>(`/electronic-invoicing/${id}/status`, dto);

// ---------- Traslados ----------
export const listTransfers = () => api.get<StockTransfer[]>("/transfers");
export const createTransfer = (dto: CreateTransferDto) =>
  api.post<StockTransfer>("/transfers", dto);
export const updateTransferStatus = (id: number, dto: UpdateTransferStatusDto) =>
  api.patch<StockTransfer>(`/transfers/${id}/status`, dto);

// ---------- Usuarios ----------
export function listUsers(opts: { role?: string; branchId?: number; cityId?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.role) params.set("role", opts.role);
  if (opts.branchId) params.set("branchId", String(opts.branchId));
  if (opts.cityId) params.set("cityId", String(opts.cityId));
  const qs = params.toString();
  return api.get<User[]>(`/users${qs ? `?${qs}` : ""}`);
}

export const createUser = (dto: CreateUserDto) => api.post<User>("/users", dto);
export const updateUser = (id: number, dto: Partial<CreateUserDto> & { isActive?: boolean }) =>
  api.patch<User>(`/users/${id}`, dto);

// ---------- Auditoría ----------
export function listAudit(opts: { entityType?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.entityType) params.set("entityType", opts.entityType);
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return api.get<AuditListResponse>(`/audit${qs ? `?${qs}` : ""}`);
}