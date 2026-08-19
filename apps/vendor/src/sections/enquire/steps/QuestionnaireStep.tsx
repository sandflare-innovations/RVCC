"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { EnquireActions } from "@/sections/enquire/EnquireActions";
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
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!registration?.questionnaire) return;
    const map: Record<string, string> = {};
    for (const q of registration.questionnaire) map[q.questionKey] = q.answer;
    setAnswers(map);
  }, [registration]);

  const buildQuestionnaire = () =>
    ENQUIRE_QUESTIONNAIRE.map((q) => ({
      questionKey: q.key,
      answer: answers[q.key] || "",
    }));

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({ step: "questionnaire", questionnaire: buildQuestionnaire() });
    setPendingAction(null);
  };

  const goNext = () => {
    advanceTo("attachments", { questionnaire: buildQuestionnaire() });
  };

  if (loading && !registration) return null;

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

      <EnquireActions>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          onClick={() => router.push("/enquire/products")}
        >
          Back
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={saving}
          pending={pendingAction === "save"}
          onClick={() => void saveLater()}
        >
          Save for Later
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="button"
          variant="solid"
          className="sm:w-auto"
          fullWidth
          onClick={goNext}
        >
          Next: Documents
        </InteractiveHoverButton>
      </EnquireActions>
    </div>
  );
}
