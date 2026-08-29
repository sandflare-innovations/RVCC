export type ProcurementProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function getClientProcurementProfile(): ProcurementProfile | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("rvcc_procurement_profile="));
  if (!match) return null;
  const raw = match.split("=")[1];
  if (!raw) return null;
  try {
    const unescaped = decodeURIComponent(raw);
    const base64 = unescaped.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr) as ProcurementProfile;
  } catch {
    return null;
  }
}
