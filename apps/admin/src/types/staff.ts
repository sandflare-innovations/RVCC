export type AdminRoleName =
  "SUPER_ADMIN" | "ADMIN" | "PROCUREMENT_ADMIN" | "VENDOR_ADMIN" | "WEBSITE_ADMIN" | "REVIEWER";

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  position: string;
  department?: string;
  phone?: string;
  role: AdminRoleName;
  isActive: boolean;
  lastLoginAt: string | null;
  failedAttempts: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  position: string;
  role: AdminRoleName;
  password: string;
  otpCode: string;
}

export interface UpdateStaffInput {
  name?: string;
  position?: string;
  role?: AdminRoleName;
  isActive?: boolean;
  otpCode?: string;
}

export interface ResetPasswordInput {
  newPassword: string;
  otpCode: string;
}
