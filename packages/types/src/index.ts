export type AdminRoleName =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PROCUREMENT_ADMIN"
  | "VENDOR_ADMIN"
  | "WEBSITE_ADMIN"
  | "REVIEWER";

export const ROLE_RANK: Record<AdminRoleName, number> = {
  REVIEWER: 1,
  WEBSITE_ADMIN: 2,
  VENDOR_ADMIN: 2,
  PROCUREMENT_ADMIN: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function canManageStaff(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageVendors(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "VENDOR_ADMIN";
}

export function canManageProcurement(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "PROCUREMENT_ADMIN";
}

export function canManageWebsite(role: AdminRoleName): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "WEBSITE_ADMIN";
}

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
