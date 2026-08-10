"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertCircle, ExternalLink, Eye, KeyRound, Power } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/api/read-error";

export type VendorSummary = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  lockedUntil: string | null;
  activeSessions: number;
  registrationId: string;
  companyName: string;
  referenceNumber: string | null;
  registrationStatus: string;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(130px,190px)_1fr] gap-3 border-b border-zinc-100 py-1.5 last:border-0">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="text-sm break-words text-zinc-950">{value?.trim() || "—"}</dd>
    </div>
  );
}

export function VendorRowActions({ vendor }: { vendor: VendorSummary }) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);

  const v = vendor;

  const toggleActive = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendors/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !v.isActive }),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not update the account."));
        return;
      }
      setShowToggle(false);
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
      const res = await fetch(`/api/admin/vendors/${v.id}/reset-password`, {
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
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          aria-label={`View details for ${v.email}`}
          title="View details"
          className="hover:text-brand-blue rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setIssued(null);
            setError(null);
            setShowReset(true);
          }}
          aria-label={`Reset password for ${v.email}`}
          title="Reset password"
          className="hover:text-brand-blue rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <KeyRound className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowToggle(true);
          }}
          aria-label={`${v.isActive ? "Disable" : "Enable"} ${v.email}`}
          title={v.isActive ? "Disable account" : "Enable account"}
          className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <Power className="h-4 w-4" />
        </button>
      </div>

      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title={v.email}
        description={v.companyName}
        footer={
          <Link
            href={`/admin/registrations/${v.registrationId}`}
            className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors"
          >
            Open registration
            <ExternalLink className="h-4 w-4" />
          </Link>
        }
      >
        <dl>
          <Row label="Name" value={v.name} />
          <Row label="Email" value={v.email} />
          <Row label="Status" value={v.isActive ? "Active" : "Disabled"} />
          <Row
            label="Password"
            value={v.mustChangePassword ? "Temporary — must be changed" : "Set by vendor"}
          />
          <Row label="Locked until" value={v.lockedUntil} />
          <Row label="Last sign-in" value={v.lastLoginAt} />
          <Row label="Active sessions" value={String(v.activeSessions)} />
          <Row label="Account created" value={v.createdAt} />
          <Row label="Company" value={v.companyName} />
          <Row label="Reference" value={v.referenceNumber} />
          <Row label="Registration status" value={v.registrationStatus.toLowerCase()} />
        </dl>
      </Modal>

      <Modal
        open={showReset}
        onClose={() => {
          setShowReset(false);
          setIssued(null);
        }}
        title="Reset password"
        description={v.email}
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
            <p className="mt-3 text-xs text-zinc-900">
              Shown <strong>once</strong> — only a hash is stored. All existing sessions were signed
              out, and the vendor must set a new password on next sign-in.
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-700">
            Issues a new temporary password for <strong className="text-zinc-950">{v.email}</strong>
            , signs out all their devices, and forces a password change on next sign-in. Their
            current password stops working immediately.
          </p>
        )}
      </Modal>

      <Modal
        open={showToggle}
        onClose={() => setShowToggle(false)}
        title={v.isActive ? "Disable account" : "Enable account"}
        description={v.email}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowToggle(false)}
              disabled={busy}
              className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void toggleActive()}
              disabled={busy}
              className={
                v.isActive
                  ? "inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-55"
                  : "bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:opacity-55"
              }
            >
              <Power className="h-4 w-4" />
              {busy ? "Saving…" : v.isActive ? "Disable" : "Enable"}
            </button>
          </>
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
        <p className="text-sm text-zinc-700">
          {v.isActive ? (
            <>
              <strong className="text-zinc-950">{v.email}</strong> will be signed out of{" "}
              {v.activeSessions} active session{v.activeSessions === 1 ? "" : "s"} and blocked from
              signing in. The registration itself is unaffected, and you can re-enable at any time.
            </>
          ) : (
            <>
              <strong className="text-zinc-950">{v.email}</strong> will be able to sign in again
              using their existing password.
            </>
          )}
        </p>
      </Modal>
    </>
  );
}
