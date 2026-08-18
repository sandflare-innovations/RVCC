"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, Check, KeyRound, Mail, Scale, X } from "lucide-react";

import { Modal, SubmitLoader } from "@/components/ui";

import { readApiError } from "@/lib/read-error";

type Credential = { email: string; tempPassword: string };
type Notified = {
  attempted: boolean;
  sent: string[];
  failed: { to: string; error: string }[];
  error?: string;
};
type Outcome = { credentials: Credential[]; notified: Notified | null };

export function ReviewPanel({
  registrationId,
  status,
}: {
  registrationId: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  if (status !== "SUBMITTED" && !outcome) return null;

  const submit = async (action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !note.trim()) {
      setError("Give a reason so the vendor knows what to fix.");
      return;
    }
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${registrationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not complete the review."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      setOutcome({ credentials: data.credentials ?? [], notified: data.notified ?? null });
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (outcome) {
    const n = outcome.notified;
    const delivered = new Set(n?.sent ?? []);
    const undelivered = outcome.credentials.filter((c) => !delivered.has(c.email));
    const mailProblem = Boolean(n?.error) || (n?.failed.length ?? 0) > 0 || !n?.attempted;

    return (
      <div className="border-brand-blue bg-brand-blue/5 rounded-lg border-l-4 p-5">
        <div className="flex items-center gap-2 text-zinc-900">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          <p className="text-sm font-semibold">
            {outcome.credentials.length
              ? "Approved — portal accounts created"
              : "Decision recorded"}
          </p>
        </div>

        {n && delivered.size > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-900">
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            Emailed to {[...delivered].join(", ")}.
          </p>
        )}

        {mailProblem && (
          <p className="mt-2 text-sm font-medium text-zinc-900">
            {n?.error ?? "Some emails could not be delivered."} Pass the details below on securely.
          </p>
        )}

        {undelivered.length > 0 && (
          <>
            <ul className="mt-3 space-y-1.5">
              {undelivered.map((c) => (
                <li
                  key={c.email}
                  className="border-brand-blue/40 rounded-md border bg-white px-3 py-2 font-mono text-sm"
                >
                  {c.email} — <strong>{c.tempPassword}</strong>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-900">
              Shown <strong>once</strong> — only a hash is stored, so these cannot be retrieved
              again. Each vendor must set a new password on first sign-in.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <Scale className="h-4 w-4 text-zinc-500" />
            Review Required
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Evaluate this registration to approve or reject the vendor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Review Decision
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Review Vendor Registration"
        maxWidth="lg"
      >
        <div className="p-6">
          <p className="mb-6 text-sm text-zinc-600">
            Approving creates portal logins for contacts who requested one and marks the vendor
            spend-authorized.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <label
            htmlFor="review-note"
            className="mb-2 block text-xs font-bold tracking-[0.12em] text-zinc-700 uppercase"
          >
            Review Note{" "}
            <span className="font-normal text-zinc-500 normal-case">(Required to reject)</span>
          </label>
          <textarea
            id="review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Provide context for the approval or rejection..."
            className="focus:border-brand-blue focus:ring-brand-blue w-full resize-none rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 transition-all outline-none focus:bg-white focus:ring-1"
          />

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-100 pt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit("REJECT")}
              disabled={busy !== null}
              className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {busy === "REJECT" ? <SubmitLoader text="Rejecting" /> : "Reject"}
            </button>
            <button
              type="button"
              onClick={() => void submit("APPROVE")}
              disabled={busy !== null}
              className="bg-brand-blue hover:bg-brand-blue/90 inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {busy === "APPROVE" ? <SubmitLoader text="Approving" /> : "Approve Vendor"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
