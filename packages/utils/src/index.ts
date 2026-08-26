import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes cleanly with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Shared Application Cookie Names & Configs
 */
export const ADMIN_COOKIE = "rvcc_admin_session";
export const ADMIN_PROFILE_COOKIE = "rvcc_admin_profile";
export const VENDOR_COOKIE = "rvcc_vendor_session";
export const VENDOR_PROFILE_COOKIE = "rvcc_vendor_profile";

export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14d
export const VENDOR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30d
