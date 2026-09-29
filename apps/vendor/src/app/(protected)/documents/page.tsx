import { FileText } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { VENDOR_COOKIE, VENDOR_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { vendorApiFetch } from "@/lib/vendor-api";

export const dynamic = "force-dynamic";

type PortalDoc = {
  id: string;
  title: string;
  category: string;
  description?: string;
  fileUrl: string;
  fileSize?: string;
};

export default async function VendorDocumentsPage() {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect(VENDOR_LOGIN_EXPIRED_PATH);
  if (vendor.mustChangePassword) redirect("/password");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  let documents: PortalDoc[] = [];
  try {
    const res = await vendorApiFetch("/documents", {
      method: "GET",
      sessionToken: token,
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      const data = await res.json();
      documents = Array.isArray(data.documents) ? data.documents : [];
    }
  } catch (err) {
    console.error("[vendor] documents fetch failed", err);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Documents</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Policies and files published by RVCC for vendors.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">No documents have been published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:border-brand-blue/30 flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors"
            >
              <div className="bg-brand-blue flex h-10 w-10 items-center justify-center rounded-xl">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800">{doc.title}</p>
                <p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                  {doc.category}
                  {doc.fileSize ? ` · ${doc.fileSize}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
