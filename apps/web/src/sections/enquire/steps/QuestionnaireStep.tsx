"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
  enquireTextareaClass,
} from "@/sections/enquire/EnquireField";

export function QuestionnaireStep() {
  useRequireSession("questionnaire");
  const router = useRouter();
  const { registration, saveDraft, loading } = useEnquire();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!registration?.questionnaire) return;
    const map: Record<string, string> = {};
    for (const q of registration.questionnaire) map[q.questionKey] = q.answer;
    setAnswers(map);
  }, [registration]);

  const persist = async (next: string) => {
    const questionnaire = ENQUIRE_QUESTIONNAIRE.map((q) => ({
      questionKey: q.key,
      answer: answers[q.key] || "",
    }));
    const ok = await saveDraft({ step: next, questionnaire });
    if (ok) router.push(`/enquire/${next}`);
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="space-y-8">
      {ENQUIRE_QUESTIONNAIRE.map((q) => (
        <EnquireField key={q.key} label={q.label} required={q.required}>
          {q.type === "select" ? (
            <select
              className={enquireSelectClass}
              value={answers[q.key] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
            >
              <option value="">Select…</option>
              {q.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : q.type === "textarea" ? (
            <textarea
              className={enquireTextareaClass}
              value={answers[q.key] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
            />
          ) : (
            <input
              className={enquireInputClass}
              value={answers[q.key] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
            />
          )}
        </EnquireField>
      ))}

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => router.push("/enquire/products")}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => void persist("questionnaire")}
        >
          Save for Later
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-14 rounded-none"
          onClick={() => void persist("review")}
        >
          Next: Review
        </Button>
      </div>
    </div>
  );
}
