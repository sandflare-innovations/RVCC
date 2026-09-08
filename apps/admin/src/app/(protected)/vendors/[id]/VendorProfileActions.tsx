"use client";

import { AlertCircle, Check, Copy, KeyRound, Lock, Trash2, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import { clearVendorCache } from "@/lib/vendor-cache";

export function VendorProfileActions({
  vendor,
}: {
  vendor: {
    id: string;
    email: string;
    name?: string | null;
    companyName?: string | null;
    isActive?: boolean;
    portalAccess: "HELD" | "RELEASED";
  };
}) {
  const router = useRouter();
  const [showAccess, setShowAccess] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [accessIssued, setAccessIssued] = useState<string | null>(null);
  const [accessCopied, setAccessCopied] = useState(false);

  const isBlocked = vendor.isActive === false || vendor.portalAccess === "HELD";

  const copyToClipboard = async (text: string, setCopiedFn: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFn(true);
      setTimeout(() => setCopiedFn(false), 2000);
    } catch {
      /* fallback: select the text for manual copy */
    }
  };

  const setPortalAccess = async (portalAccess: "HELD" | "RELEASED", notifyEmail: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          portalAccess,
          isActive: portalAccess === "RELEASED",
          notifyEmail,
        }),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not update vendor status."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.tempPassword) {
        setAccessIssued(data.tempPassword);
      } else {
        setShowAccess(false);
      }
      clearVendorCache();
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not reset the password."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      setIssued(data.tempPassword);
      clearVendorCache();
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const deleteVendor = async () => {
    setBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete vendor account."));
        return;
      }
      clearVendorCache();
      setShowDelete(false);
      router.push("/vendors");
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            setIssued(null);
            setError(null);
            setShowReset(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/80 transition-all hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.98]"
        >
          <KeyRound className="h-4 w-4 text-zinc-500" />
          Reset Password
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setAccessIssued(null);
            setAccessCopied(false);
            setShowAccess(true);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
            isBlocked
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {isBlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {isBlocked ? "Unblock Vendor" : "Block Vendor"}
        </button>

        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setShowDelete(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-all hover:bg-red-100 hover:border-red-300 active:scale-[0.98]"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
          Delete Vendor
        </button>
      </div>

      {/* Password Reset Modal */}
      <Modal
        open={showReset}
        onClose={() => {
          setShowReset(false);
          setIssued(null);
          setCopied(false);
        }}
        title="Reset password"
        description={vendor.email}
        footer={
          issued ? (
            <button
              type="button"
              onClick={() => {
                setShowReset(false);
                setIssued(null);
                setCopied(false);
              }}
              className="bg-brand-blue hover:bg-brand-blue/90 h-10 rounded-md px-4 text-sm font-semibold text-white transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                disabled={busy}
                className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void resetPassword()}
                disabled={busy}
                className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:opacity-55"
              >
                <KeyRound className="h-4 w-4" />
                {busy ? "Resetting…" : "Issue new password"}
              </button>
            </>
          )
        }
      >
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 border-l-4 border-red-500 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {issued ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="bg-brand-blue/10 flex h-14 w-14 items-center justify-center rounded-full">
              <KeyRound className="text-brand-blue h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-900">New temporary password issued</p>
              <p className="text-sm text-zinc-500">
                Share this with <strong>{vendor.email}</strong> securely.
              </p>
            </div>
            <div className="w-full">
              <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                <input
                  readOnly
                  value={issued}
                  className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-zinc-900 outline-none select-all"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  onClick={() => void copyToClipboard(issued, setCopied)}
                  className="flex h-full items-center gap-1.5 border-l border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-700">
            Issues a new temporary password for{" "}
            <strong className="text-zinc-950">{vendor.email}</strong>.
          </p>
        )}
      </Modal>

      {/* Block / Unblock Modal */}
      <Modal
        open={showAccess}
        onClose={() => {
          setShowAccess(false);
          setAccessIssued(null);
          setAccessCopied(false);
        }}
        title={isBlocked ? "Unblock vendor" : "Block vendor"}
        description={vendor.email}
        footer={
          accessIssued ? (
            <button
              type="button"
              onClick={() => {
                setShowAccess(false);
                setAccessIssued(null);
                setAccessCopied(false);
              }}
              className="bg-brand-blue hover:bg-brand-blue/90 h-10 rounded-md px-4 text-sm font-semibold text-white transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowAccess(false)}
                disabled={busy}
                className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void setPortalAccess(isBlocked ? "RELEASED" : "HELD", true)}
                disabled={busy}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:opacity-55 ${
                  isBlocked
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isBlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {busy ? "Updating…" : isBlocked ? "Unblock & Release" : "Confirm Block"}
              </button>
            </>
          )
        }
      >
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 border-l-4 border-red-500 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {accessIssued ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="bg-brand-blue/10 flex h-14 w-14 items-center justify-center rounded-full">
              <KeyRound className="text-brand-blue h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-900">New temporary password issued</p>
              <p className="text-sm text-zinc-500">
                Share this with <strong>{vendor.email}</strong> securely.
              </p>
            </div>
            <div className="w-full">
              <div className="flex items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                <input
                  readOnly
                  value={accessIssued}
                  className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-zinc-900 outline-none select-all"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  onClick={() => void copyToClipboard(accessIssued, setAccessCopied)}
                  className="flex h-full items-center gap-1.5 border-l border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  {accessCopied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-700">
              {isBlocked
                ? "Unblocking this vendor will activate their account and grant them access to the vendor portal. They will be notified via email."
                : "Blocking this vendor will deactivate their account, revoke all active sessions immediately, and prevent any logins."}
            </p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDelete}
        onClose={() => !busy && setShowDelete(false)}
        title="Delete Vendor Account"
        description={vendor.email}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              disabled={busy}
              className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void deleteVendor()}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-55"
            >
              <Trash2 className="h-4 w-4" />
              {busy ? "Deleting…" : "Yes, Delete Vendor"}
            </button>
          </>
        }
      >
        {deleteError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 border-l-4 border-red-500 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{deleteError}</span>
          </div>
        )}
        <div className="space-y-3">
          <p className="text-sm text-zinc-700">
            Are you sure you want to delete the vendor account for{" "}
            <strong className="text-zinc-950">{vendor.name || vendor.email}</strong>
            {vendor.companyName && vendor.companyName !== "—" ? ` (${vendor.companyName})` : ""}?
          </p>
          <div className="rounded-lg border border-red-100 bg-red-50/70 p-3 text-xs text-red-800">
            <strong>Warning:</strong> All active sessions will be terminated immediately. The vendor
            will be removed from the active vendor list. Existing quotes and invites will be
            preserved for audit history.
          </div>
        </div>
      </Modal>
    </>
  );
}
