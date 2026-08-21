"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Unlock, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";

export function VendorProfileActions({
  vendor,
}: {
  vendor: {
    id: string;
    email: string;
    portalAccess: "HELD" | "RELEASED";
  };
}) {
  const router = useRouter();
  const [showAccess, setShowAccess] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);

  const held = vendor.portalAccess !== "RELEASED";

  const setPortalAccess = async (portalAccess: "HELD" | "RELEASED", notifyEmail: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ portalAccess, notifyEmail }),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not update portal access."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.tempPassword) setIssued(data.tempPassword);
      setShowAccess(false);
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
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setIssued(null);
            setError(null);
            setShowReset(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
        >
          <KeyRound className="h-4 w-4 text-zinc-500" />
          Reset Password
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIssued(null);
            setShowAccess(true);
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
            held 
              ? "bg-brand-blue hover:bg-brand-blue/90" 
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {held ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {held ? "Release Access" : "Hold Access"}
        </button>
      </div>

      {/* Password Reset Modal */}
      <Modal
        open={showReset}
        onClose={() => {
          setShowReset(false);
          setIssued(null);
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
            className="mb-4 flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {issued ? (
          <div className="border-brand-blue bg-brand-blue/5 rounded-md border-l-4 p-4">
            <p className="text-sm font-semibold text-zinc-900">New temporary password</p>
            <p className="border-brand-blue/40 mt-2 rounded-md border bg-white px-3 py-2 font-mono text-sm">
              {issued}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-700">
            Issues a new temporary password for <strong className="text-zinc-950">{vendor.email}</strong>.
          </p>
        )}
      </Modal>

      {/* Access Modal */}
      <Modal
        open={showAccess}
        onClose={() => setShowAccess(false)}
        title={held ? "Release portal access" : "Hold portal access"}
        description={vendor.email}
        footer={
          issued ? (
            <button
              type="button"
              onClick={() => {
                setShowAccess(false);
                setIssued(null);
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
                onClick={() => void setPortalAccess(held ? "RELEASED" : "HELD", true)}
                disabled={busy}
                className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:opacity-55"
              >
                {held ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {busy ? "Updating…" : held ? "Release & Notify" : "Hold Account"}
              </button>
            </>
          )
        }
      >
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {issued ? (
          <div className="border-brand-blue bg-brand-blue/5 rounded-md border-l-4 p-4">
            <p className="text-sm font-semibold text-zinc-900">
              New temporary password issued
            </p>
            <p className="border-brand-blue/40 mt-2 rounded-md border bg-white px-3 py-2 font-mono text-sm">
              {issued}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-700">
              {held
                ? "Releasing access allows the vendor to sign in. If their password was previously reset or they must change it, a new temporary password will be issued and emailed to them."
                : "Holding access immediately signs the vendor out of all active sessions and prevents future logins."}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
