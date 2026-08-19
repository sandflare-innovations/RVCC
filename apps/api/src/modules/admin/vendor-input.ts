export type CreateVendorInput = {
  email: string;
  name: string;
  company?: string;
  phone?: string;
  industryIds?: string[];
};

export type NormalisedVendorInput = {
  email: string;
  name: string;
  company: string;
  phone: string;
  industryIds: string[];
};

/**
 * Trims and lower-cases the identifying fields, and rejects the empty cases by
 * name so the admin sees which field is wrong.
 *
 * Deliberately free of database and Worker imports: kept in its own module so
 * these rules can be tested without `postgres` or a request context, neither of
 * Vendor input validation — runs in apps/api where postgres is available.
 */
export function normaliseVendorInput(input: CreateVendorInput): NormalisedVendorInput {
  const email = String(input?.email ?? "")
    .trim()
    .toLowerCase();
  const name = String(input?.name ?? "").trim();

  if (!email) throw new Error("An email is required.");
  if (!name) throw new Error("A name is required.");

  return {
    email,
    name,
    company: String(input.company ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    industryIds: Array.isArray(input.industryIds) ? input.industryIds : [],
  };
}
