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
    const jsonStr = decodeURIComponent(
      atob(raw.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return JSON.parse(jsonStr) as ProcurementProfile;
  } catch {
    return null;
  }
}
