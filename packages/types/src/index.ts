/**
 * RVCC Platform Core Types & Domain Models
 */

export type AdminRoleName = "SUPER_ADMIN" | "ADMIN" | "REVIEWER";

export const ROLE_RANK: Record<AdminRoleName, number> = {
  REVIEWER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function hasRole(role: AdminRoleName, minimum: AdminRoleName): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export type RegistrationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface CompanyInfo {
  legalName?: string;
  dbaName?: string;
  country?: string;
  taxIdentifiers?: {
    vat?: string;
    cr?: string;
    tin?: string;
  };
  organizationType?: string;
  supplierType?: string;
  website?: string;
  yearEstablished?: string;
  dunsNumber?: string;
  description?: string;
}

export interface ContactItem {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  phone?: string;
  mobile?: string;
  isAdministrative?: boolean;
  requestUserAccount?: boolean;
}

export interface AddressItem {
  id?: string;
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  addressType?: string;
}

export interface BankItem {
  id?: string;
  beneficiaryName?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  routingNumber?: string;
  branchName?: string;
  currency?: string;
  country?: string;
  isPrimary?: boolean;
}

export interface DocumentItem {
  id?: string;
  name?: string;
  type?: string;
  fileKey?: string;
  url?: string;
  uploadedAt?: string;
  size?: number;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}
