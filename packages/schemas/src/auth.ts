import { z } from "zod";
import { emailSchema } from "./common";

/**
 * Authentication & OTP Schemas
 */
export const otpRequestSchema = z.object({
  email: emailSchema,
  action: z.string().max(50).optional(),
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Must be a 6-digit verification code"),
  action: z.string().max(50).optional(),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128, "Password too long"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const changePasswordRequestOtpSchema = z.object({
  action: z.literal("PASSWORD_CHANGE").default("PASSWORD_CHANGE"),
});
export type ChangePasswordRequestOtpInput = z.infer<typeof changePasswordRequestOtpSchema>;

export const changePasswordVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Must be a 6-digit verification code"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});
export type ChangePasswordVerifyInput = z.infer<typeof changePasswordVerifySchema>;

export const vendorPasswordResetSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .optional(),
});
export type VendorPasswordResetInput = z.infer<typeof vendorPasswordResetSchema>;
