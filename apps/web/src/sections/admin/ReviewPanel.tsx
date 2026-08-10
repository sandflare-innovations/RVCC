"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, Check, KeyRound, Mail, X } from "lucide-react";

import { readApiError } from "@/lib/api/read-error";

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
      const res = await fetch(`/api/admin/registrations/${registrationId}/review`, {
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
    // Only reveal a password that did NOT reach the vendor's inbox.
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
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-950">Review decision</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Approving creates portal logins for contacts who requested one and marks the vendor
        spend-authorized.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <label
        htmlFor="review-note"
        className="mt-4 block text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase"
      >
        Note <span className="font-normal normal-case">(required to reject)</span>
      </label>
      <textarea
        id="review-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Reason for the decision…"
        className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 mt-1.5 w-full resize-y rounded-md border border-zinc-300 px-3.5 py-2.5 text-base outline-none focus-visible:ring-[3px]"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void submit("APPROVE")}
          disabled={busy !== null}
          className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-semibold text-white transition-colors disabled:pointer-events-none disabled:opacity-55"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {busy === "APPROVE" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => void submit("REJECT")}
          disabled={busy !== null}
          className="inline-flex h-11 items-center gap-2 rounded-md border-2 border-zinc-900 px-5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:pointer-events-none disabled:opacity-55"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {busy === "REJECT" ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </div>
  );
}
