// Guardia de paridad de contratos frontend <-> backend.
// Compila con `npm run typecheck:contracts`. Falla en tiempo de compilación
// (con el nombre del DTO) si algún DTO o enum del espejo en
// `src/lib/contracts.ts` deja de ser compatible con lo que el backend espera.

import type { Role as BackendRole } from "@backend/common/enums/role.enum";
import type { LoginDto as BackendLoginDto } from "@backend/modules/auth/dto/login.dto";
import type { SaleItemDto as BackendSaleItemDto, CreateSaleDto as BackendCreateSaleDto } from "@backend/modules/sales/dto/create-sale.dto";
import type { CreateMedicineDto as BackendCreateMedicineDto } from "@backend/modules/medicines/dto/create-medicine.dto";
import type { CreateBatchDto as BackendCreateBatchDto } from "@backend/modules/batches/dto/create-batch.dto";
import type { CreateSupplierDto as BackendCreateSupplierDto } from "@backend/modules/suppliers/dto/create-supplier.dto";
import type { CreateBranchDto as BackendCreateBranchDto } from "@backend/modules/branches/dto/create-branch.dto";
import type { CreateCityDto as BackendCreateCityDto } from "@backend/modules/cities/dto/create-city.dto";
import type { CreateAmbientReadingDto as BackendCreateAmbientReadingDto } from "@backend/modules/temperatura-humidity/dto/ambient-reading.dto";
import type { CreatePrescriptionDto as BackendCreatePrescriptionDto, UpdatePrescriptionStatusDto as BackendUpdatePrescriptionStatusDto } from "@backend/modules/prescripciones/dto/prescription.dto";
import type { CreateSanitaryRecordDto as BackendCreateSanitaryRecordDto } from "@backend/modules/invima-sanitary/dto/sanitary-record.dto";
import type { CreateAdverseEventReportDto as BackendCreateAdverseEventReportDto, UpdateReportStatusDto as BackendUpdateReportStatusDto } from "@backend/modules/pharmacovigilance/dto/adverse-event-report.dto";
import type { CreateElectronicInvoiceDto as BackendCreateElectronicInvoiceDto, UpdateInvoiceStatusDto as BackendUpdateInvoiceStatusDto } from "@backend/modules/electronic-invoicing/dto/electronic-invoice.dto";
import type { TransferItemDto as BackendTransferItemDto, CreateTransferDto as BackendCreateTransferDto, UpdateTransferStatusDto as BackendUpdateTransferStatusDto } from "@backend/modules/transfers/dto/transfer.dto";
import type { CreateUserDto as BackendCreateUserDto } from "@backend/modules/users/dto/create-user.dto";

import type {
  Role,
  LoginDto,
  SaleItemDto,
  CreateSaleDto,
  CreateMedicineDto,
  CreateBatchDto,
  CreateSupplierDto,
  CreateBranchDto,
  CreateCityDto,
  CreateAmbientReadingDto,
  CreatePrescriptionDto,
  UpdatePrescriptionStatusDto,
  CreateSanitaryRecordDto,
  CreateAdverseEventReportDto,
  UpdateReportStatusDto,
  CreateElectronicInvoiceDto,
  UpdateInvoiceStatusDto,
  TransferItemDto,
  CreateTransferDto,
  UpdateTransferStatusDto,
  CreateUserDto,
} from "../src/lib/contracts";

// Falla si T no es exactamente `true`.
type Assert<T extends true> = T;

// Los string-enums del backend son nominales: se normalizan a la unión de
// sus valores literales para poder compararlos con las uniones del espejo.
type Normalize<T> = T extends BackendRole
  ? `${T}`
  : T extends readonly (infer U)[]
    ? Normalize<U>[]
    : T extends object
      ? { [K in keyof T]: Normalize<T[K]> }
      : T;

// Chequeo en la dirección de envío: lo que el frontend manda debe cumplir el
// tipo del DTO que el backend espera.
type CheckSubmit<M, B> = [Normalize<M>] extends [Normalize<B>] ? true : false;

// --- Enum Role (comparación bidireccional de valores) ---
type RoleValues = `${BackendRole}`;
type RoleForward = [Role] extends [RoleValues] ? true : false;
type RoleBackward = [RoleValues] extends [Role] ? true : false;

// --- Paridad de DTOs ---
type LoginDtoCheck = CheckSubmit<LoginDto, BackendLoginDto>;
type SaleItemDtoCheck = CheckSubmit<SaleItemDto, BackendSaleItemDto>;
type CreateSaleDtoCheck = CheckSubmit<CreateSaleDto, BackendCreateSaleDto>;
type CreateMedicineDtoCheck = CheckSubmit<CreateMedicineDto, BackendCreateMedicineDto>;
type CreateBatchDtoCheck = CheckSubmit<CreateBatchDto, BackendCreateBatchDto>;
type CreateSupplierDtoCheck = CheckSubmit<CreateSupplierDto, BackendCreateSupplierDto>;
type CreateBranchDtoCheck = CheckSubmit<CreateBranchDto, BackendCreateBranchDto>;
type CreateCityDtoCheck = CheckSubmit<CreateCityDto, BackendCreateCityDto>;
type CreateAmbientReadingDtoCheck = CheckSubmit<CreateAmbientReadingDto, BackendCreateAmbientReadingDto>;
type CreatePrescriptionDtoCheck = CheckSubmit<CreatePrescriptionDto, BackendCreatePrescriptionDto>;
type UpdatePrescriptionStatusDtoCheck = CheckSubmit<UpdatePrescriptionStatusDto, BackendUpdatePrescriptionStatusDto>;
type CreateSanitaryRecordDtoCheck = CheckSubmit<CreateSanitaryRecordDto, BackendCreateSanitaryRecordDto>;
type CreateAdverseEventReportDtoCheck = CheckSubmit<CreateAdverseEventReportDto, BackendCreateAdverseEventReportDto>;
type UpdateReportStatusDtoCheck = CheckSubmit<UpdateReportStatusDto, BackendUpdateReportStatusDto>;
type CreateElectronicInvoiceDtoCheck = CheckSubmit<CreateElectronicInvoiceDto, BackendCreateElectronicInvoiceDto>;
type UpdateInvoiceStatusDtoCheck = CheckSubmit<UpdateInvoiceStatusDto, BackendUpdateInvoiceStatusDto>;
type TransferItemDtoCheck = CheckSubmit<TransferItemDto, BackendTransferItemDto>;
type CreateTransferDtoCheck = CheckSubmit<CreateTransferDto, BackendCreateTransferDto>;
type UpdateTransferStatusDtoCheck = CheckSubmit<UpdateTransferStatusDto, BackendUpdateTransferStatusDto>;
type CreateUserDtoCheck = CheckSubmit<CreateUserDto, BackendCreateUserDto>;

// Si algún contrato se desvía, el elemento correspondiente falla con
// "Type 'false' does not satisfy the constraint 'true'".
type _Assertions = [
  Assert<RoleForward>,
  Assert<RoleBackward>,
  Assert<LoginDtoCheck>,
  Assert<SaleItemDtoCheck>,
  Assert<CreateSaleDtoCheck>,
  Assert<CreateMedicineDtoCheck>,
  Assert<CreateBatchDtoCheck>,
  Assert<CreateSupplierDtoCheck>,
  Assert<CreateBranchDtoCheck>,
  Assert<CreateCityDtoCheck>,
  Assert<CreateAmbientReadingDtoCheck>,
  Assert<CreatePrescriptionDtoCheck>,
  Assert<UpdatePrescriptionStatusDtoCheck>,
  Assert<CreateSanitaryRecordDtoCheck>,
  Assert<CreateAdverseEventReportDtoCheck>,
  Assert<UpdateReportStatusDtoCheck>,
  Assert<CreateElectronicInvoiceDtoCheck>,
  Assert<UpdateInvoiceStatusDtoCheck>,
  Assert<TransferItemDtoCheck>,
  Assert<CreateTransferDtoCheck>,
  Assert<UpdateTransferStatusDtoCheck>,
  Assert<CreateUserDtoCheck>,
];

export const CONTRACTS_OK = true as const;