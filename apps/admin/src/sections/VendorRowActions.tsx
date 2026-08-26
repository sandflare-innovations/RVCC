"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertCircle, Check, Copy, ExternalLink, Eye, KeyRound, Lock, Unlock, MoreVertical } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";

export type VendorSummary = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  portalAccess: "HELD" | "RELEASED";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  lockedUntil: string | null;
  activeSessions: number;
  registrationId: string | null;
  companyName: string;
  referenceNumber: string | null;
  registrationStatus: string | null;
  registrationComplete: boolean;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[minmax(130px,190px)_1fr] gap-3 border-b border-zinc-100 py-1.5 last:border-0">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="text-sm break-words text-zinc-950">{value?.trim() || "—"}</dd>
    </div>
  );
}

export function VendorRowActions({
  vendor,
  onUpdated,
  onDropdownOpen,
}: {
  vendor: VendorSummary;
  /** Refresh list without a full page navigation. */
  onUpdated?: () => void;
  onDropdownOpen?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [accessIssued, setAccessIssued] = useState<string | null>(null);
  const [accessCopied, setAccessCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        onDropdownOpen?.(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const v = vendor;
  const held = v.portalAccess !== "RELEASED";

  const copyPassword = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: select the text for manual copy */
    }
  };

  const setPortalAccess = async (portalAccess: "HELD" | "RELEASED", notifyEmail: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${v.id}`, {
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
      if (onUpdated) onUpdated();
      else router.refresh();
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
      const res = await fetch(`/api/vendors/${v.id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not reset the password."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      setIssued(data.tempPassword);
      if (onUpdated) onUpdated();
      else router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={`relative flex items-center justify-end ${showDropdown ? "z-[60]" : ""}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
              const next = !showDropdown;
              setShowDropdown(next);
              onDropdownOpen?.(next);
            }}
          className="hover:text-brand-blue rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showDropdown && dropdownRef.current && createPortal(
          <div
            className="fixed z-[9999] w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-xl"
            style={{
              top: dropdownRef.current.getBoundingClientRect().bottom + 4,
              right: window.innerWidth - dropdownRef.current.getBoundingClientRect().right,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false);
                setShowDetails(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              <Eye className="h-4 w-4" />
              View details
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false);
                setIssued(null);
                setError(null);
                setShowReset(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              <KeyRound className="h-4 w-4" />
              Reset password
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false);
                setError(null);
                setAccessIssued(null);
                setAccessCopied(false);
                setShowAccess(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              {held ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {held ? "Release access" : "Block access"}
            </button>
          </div>,
          document.body
        )}
      </div>

      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title={v.email}
        description={v.companyName}
        footer={
          v.registrationId ? (
            <Link
              href={`/registrations/${v.registrationId}`}
              className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors"
            >
              Open registration
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : null
        }
      >
        <dl>
          <Row label="Name" value={v.name} />
          <Row label="Email" value={v.email} />
          <Row label="Portal access" value={held ? "Held" : "Released"} />
          <Row label="Registration" value={v.registrationComplete ? "Complete" : "Incomplete"} />
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
          <Row label="Registration status" value={v.registrationStatus?.toLowerCase() ?? "—"} />
        </dl>
      </Modal>

      <Modal
        open={showReset}
        onClose={() => {
          setShowReset(false);
          setIssued(null);
          setCopied(false);
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
              <KeyRound className="h-7 w-7 text-brand-blue" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-900">New temporary password issued</p>
              <p className="text-sm text-zinc-500">Share this with <strong>{v.email}</strong> securely.</p>
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
                  onClick={() => void copyPassword(issued, setCopied)}
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
            Issues a new temporary password for <strong className="text-zinc-950">{v.email}</strong>
            .
          </p>
        )}
      </Modal>

      <Modal
        open={showAccess}
        onClose={() => {
          setShowAccess(false);
          setAccessIssued(null);
          setAccessCopied(false);
        }}
        title={held ? "Release portal access" : "Block portal access"}
        description={v.email}
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
          ) : held ? (
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
                onClick={() => void setPortalAccess("RELEASED", false)}
                disabled={busy}
                className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-55"
              >
                {busy ? "Saving…" : "No Need"}
              </button>
              <button
                type="button"
                onClick={() => void setPortalAccess("RELEASED", true)}
                disabled={busy}
                className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:opacity-55"
              >
                <Unlock className="h-4 w-4" />
                {busy ? "Releasing…" : "Notify Via Email"}
              </button>
            </>
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
                onClick={() => void setPortalAccess("HELD", false)}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-55"
              >
                <Lock className="h-4 w-4" />
                {busy ? "Blocking…" : "Block access"}
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
              <KeyRound className="h-7 w-7 text-brand-blue" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-900">New temporary password issued</p>
              <p className="text-sm text-zinc-500">Share this with <strong>{v.email}</strong> securely.</p>
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
                  onClick={() => void copyPassword(accessIssued, setAccessCopied)}
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
        ) : held ? (
          <p className="text-sm text-zinc-700">
            Release portal access for <strong className="text-zinc-950">{v.email}</strong>? Choose{" "}
            <strong>Notify Via Email</strong> to send “Access Your Vendor Portal”, or{" "}
            <strong>No Need</strong> to release without email.
          </p>
        ) : (
          <p className="text-sm text-zinc-700">
            Block portal access for <strong className="text-zinc-950">{v.email}</strong>? They will
            be signed out and cannot use vendor pages until you release access again.
          </p>
        )}
      </Modal>
    </>
  );
}
