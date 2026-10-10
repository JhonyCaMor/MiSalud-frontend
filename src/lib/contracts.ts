// Contratos de datos compartidos con el backend (misalud-backend).
// Son equivalentes estructurales (idénticos en campos y tipos) a los DTOs
// de creación, entidades de respuesta y enums definidos en NestJS,
// para mantener el tipado estricto en todo el frontend.

export const ROLES = ["super_admin", "supervisor", "vendedor"] as const;
export type Role = (typeof ROLES)[number];

export const ZONES = ["ambiente", "refrigerado"] as const;
export type Zone = (typeof ZONES)[number];

export const PRESCRIPTION_STATUSES = ["activa", "retenida", "anulada"] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export const SANITARY_CATEGORIES = [
  "Medicamento",
  "Dispositivo médico",
  "Insumo",
  "Cosmético",
] as const;
export type SanitaryCategory = (typeof SANITARY_CATEGORIES)[number];

export const REPORT_SEVERITIES = ["leve", "moderado", "grave"] as const;
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number];

export const REPORT_STATUSES = [
  "recibido",
  "en_revision",
  "enviado_invima",
  "cerrado",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const INVOICE_STATUSES = [
  "borrador",
  "enviada",
  "aceptada",
  "rechazada",
  "anulada",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const TRANSFER_STATUSES = ["pendiente", "en_transito", "recibido", "cancelado"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

// ---------- Auth ----------
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserSanitized {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  cityId: number | null;
  branchId: number | null;
  isActive: boolean;
  city?: { id: number; name: string } | null;
  branch?: { id: number; name: string } | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUserSanitized;
}

// ---------- Catálogos ----------
export interface City {
  id: number;
  name: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCityDto {
  name: string;
  department?: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  isActive: boolean;
  cityId: number;
  city?: City;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  cityId: number;
}

export interface Supplier {
  id: number;
  nit: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  nit: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

// ---------- Medicamentos / Lotes / Inventario ----------
export interface Medicine {
  id: number;
  code: string;
  name: string;
  activeIngredient: string;
  concentration: string;
  presentation: string;
  category: string;
  invimaNumber: string;
  requiresPrescription: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineDto {
  code?: string;
  name: string;
  activeIngredient: string;
  concentration: string;
  presentation: string;
  category?: string;
  invimaNumber: string;
  requiresPrescription?: boolean;
}

export interface Batch {
  id: number;
  code: string;
  expirationDate: string;
  quantityInitial: number;
  quantityRemaining: number;
  unitCost: number;
  notes: string | null;
  isActive: boolean;
  medicineId: number;
  medicine?: Medicine;
  supplierId: number;
  supplier?: Supplier;
  branchId: number;
  branch?: Branch;
  createdAt: string;
}

export interface CreateBatchDto {
  code: string;
  medicineId: number;
  supplierId: number;
  branchId: number;
  expirationDate: string;
  quantityInitial: number;
  unitCost: number;
  notes?: string;
}

export interface InventoryItem {
  id: number;
  medicineId: number;
  medicine?: Medicine;
  branchId: number;
  branch?: Branch;
  quantityAvailable: number;
  lastMovementAt: string | null;
}

// ---------- Ventas ----------
export interface SaleItemDto {
  medicineId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleDto {
  customerName?: string;
  items: SaleItemDto[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  medicineId: number;
  medicine?: Medicine;
  batchId: number;
  batch?: Batch;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  branchId: number;
  branch?: Branch;
  sellerId: number;
  seller?: { id: number; fullName: string };
  customerName: string | null;
  total: number;
  status: string;
  items?: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Temperatura / Humedad ----------
export interface CreateAmbientReadingDto {
  branchId?: number;
  zone?: Zone;
  temperature: number;
  humidity: number;
  notes?: string;
}

export interface AmbientReading {
  id: number;
  branchId: number;
  branch?: Branch;
  zone: Zone;
  temperature: number;
  humidity: number;
  inRange: boolean;
  notes: string | null;
  recordedById: number | null;
  recordedAt: string;
}

// ---------- Prescripciones ----------
export interface CreatePrescriptionDto {
  prescriptionNumber: string;
  doctorName: string;
  doctorLicense: string;
  patientName: string;
  patientDocument: string;
  branchId?: number;
  notes?: string;
}

export interface UpdatePrescriptionStatusDto {
  status: PrescriptionStatus;
  retainedReason?: string;
}

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  doctorName: string;
  doctorLicense: string;
  patientName: string;
  patientDocument: string;
  branchId: number;
  branch?: Branch;
  sellerId: number;
  seller?: { id: number; fullName: string };
  status: PrescriptionStatus;
  retainedAt: string | null;
  retainedReason: string | null;
  notes: string | null;
  createdAt: string;
}

// ---------- Registros INVIMA ----------
export interface CreateSanitaryRecordDto {
  invimaCode: string;
  resolutionNumber: string;
  description: string;
  category: SanitaryCategory;
  issuedAt: string;
  expiresAt?: string;
  medicineId?: number;
}

export interface SanitaryRecord {
  id: number;
  invimaCode: string;
  resolutionNumber: string;
  description: string;
  category: SanitaryCategory;
  issuedAt: string;
  expiresAt: string | null;
  medicineId: number | null;
  medicine?: Medicine | null;
  isActive: boolean;
  createdAt: string;
}

// ---------- Farmacovigilancia ----------
export interface CreateAdverseEventReportDto {
  medicineId: number;
  saleId?: number;
  patientName: string;
  description: string;
  severity?: ReportSeverity;
  branchId?: number;
}

export interface UpdateReportStatusDto {
  status: ReportStatus;
}

export interface AdverseEventReport {
  id: number;
  medicineId: number;
  medicine?: Medicine;
  saleId: number | null;
  patientName: string;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  branchId: number;
  branch?: Branch;
  createdAt: string;
}

// ---------- Facturación electrónica ----------
export interface CreateElectronicInvoiceDto {
  saleId: number;
}

export interface UpdateInvoiceStatusDto {
  status: InvoiceStatus;
  dianResponse?: string;
}

export interface ElectronicInvoice {
  id: number;
  saleId: number;
  sale?: Sale;
  invoiceNumber: string;
  cufe: string;
  total: number;
  status: InvoiceStatus;
  dianResponse: string | null;
  issuedAt: string;
  updatedAt: string;
}

// ---------- Traslados ----------
export interface TransferItemDto {
  medicineId: number;
  quantity: number;
}

export interface CreateTransferDto {
  fromBranchId: number;
  toBranchId: number;
  items: TransferItemDto[];
  notes?: string;
}

export interface UpdateTransferStatusDto {
  status: "en_transito" | "recibido" | "cancelado";
}

export interface TransferItem {
  id: number;
  medicineId: number;
  medicine?: Medicine;
  quantity: number;
}

export interface StockTransfer {
  id: number;
  fromBranchId: number;
  fromBranch?: Branch;
  toBranchId: number;
  toBranch?: Branch;
  status: TransferStatus;
  notes: string | null;
  createdById: number;
  receivedById: number | null;
  items?: TransferItem[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Usuarios ----------
export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  cityId?: number;
  branchId?: number;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  cityId: number | null;
  city?: City | null;
  branchId: number | null;
  branch?: Branch | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Auditoría ----------
export interface AuditLog {
  id: number;
  method: string;
  path: string;
  entityType: string;
  entityId: number | null;
  status: number;
  userId: number | null;
  userEmail: string | null;
  userRole: string | null;
  branchId: number | null;
  ipAddress: string | null;
  requestBody: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
}

export interface AuditListResponse {
  data: AuditLog[];
  total: number;
}