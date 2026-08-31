"use client";

import { AlertCircle, Check,Copy, KeyRound, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [copied, setCopied] = useState(false);
  const [accessIssued, setAccessIssued] = useState<string | null>(null);
  const [accessCopied, setAccessCopied] = useState(false);

  const held = vendor.portalAccess !== "RELEASED";

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
        body: JSON.stringify({ portalAccess, notifyEmail }),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not update portal access."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.tempPassword) setAccessIssued(data.tempPassword);
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
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-300 transition-colors ring-inset hover:bg-zinc-50"
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
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
            held ? "bg-brand-blue hover:bg-brand-blue/90" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {held ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {held ? "Release Access" : "Block Access"}
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
            className="mb-4 flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
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

      {/* Access Modal */}
      <Modal
        open={showAccess}
        onClose={() => {
          setShowAccess(false);
          setAccessIssued(null);
          setAccessCopied(false);
        }}
        title={held ? "Release portal access" : "Block portal access"}
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
                onClick={() => void setPortalAccess(held ? "RELEASED" : "HELD", true)}
                disabled={busy}
                className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:opacity-55"
              >
                {held ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {busy ? "Updating…" : held ? "Release & Notify" : "Block Access"}
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
          <div className="space-y-4">
            <p className="text-sm text-zinc-700">
              {held
                ? "Releasing access allows the vendor to sign in. If their password was previously reset or they must change it, a new temporary password will be issued and emailed to them."
                : "Blocking access immediately signs the vendor out of all active sessions and prevents future logins."}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
