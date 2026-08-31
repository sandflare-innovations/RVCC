"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuMessageCircleQuestion as MessageCircleQuestion,
} from "react-icons/lu";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ENQUIRE_QUESTIONNAIRE } from "@/data/enquire-questionnaire";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";
import {
  enquireInputClass,
  enquireTextareaClass,
} from "@/sections/enquire/EnquireField";
import { cn } from "@lib/utils";

export function QuestionnaireStep() {
  useRequireSession("questionnaire");
  const router = useRouter();
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

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
    const nextErrors: Record<string, boolean> = {};
    let firstErrorIndex = -1;
    let hasError = false;
    
    for (let i = 0; i < ENQUIRE_QUESTIONNAIRE.length; i++) {
      const q = ENQUIRE_QUESTIONNAIRE[i];
      if (q.required && !answers[q.key]?.trim()) {
        nextErrors[q.key] = true;
        hasError = true;
        if (firstErrorIndex === -1) firstErrorIndex = i;
      }
    }
    
    if (hasError) {
      setErrors(nextErrors);
      setCurrentIndex(firstErrorIndex); // Jump to the first unanswered required question
      return;
    }

    setErrors({});
    advanceTo("attachments", { questionnaire: buildQuestionnaire() });
  };

  const handleWizardNext = () => {
    const q = ENQUIRE_QUESTIONNAIRE[currentIndex];
    if (q.required && !answers[q.key]?.trim()) {
      setErrors((prev) => ({ ...prev, [q.key]: true }));
      return;
    }
    setErrors((prev) => ({ ...prev, [q.key]: false }));

    if (currentIndex < ENQUIRE_QUESTIONNAIRE.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      goNext();
    }
  };

  const handleWizardPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const actions = (
    <>
      <InteractiveHoverButton
        type="button"
        variant="outline"
        className="h-10 px-6 min-w-[120px] text-xs sm:w-auto sm:text-xs"
        disabled={saving}
        pending={pendingAction === "save"}
        onClick={() => void saveLater()}
      >
        Draft
      </InteractiveHoverButton>
      <InteractiveHoverButton
        type="button"
        variant="solid"
        className="h-10 px-6 min-w-[120px] text-xs sm:w-auto sm:text-xs"
        onClick={goNext}
      >
        Next
      </InteractiveHoverButton>
    </>
  );

  if (loading && !registration) return null;

  const currentQ = ENQUIRE_QUESTIONNAIRE[currentIndex];
  const total = ENQUIRE_QUESTIONNAIRE.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto px-4">
      {headerNode && createPortal(actions, headerNode)}
      
      <div className="w-full flex flex-col items-center text-center space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-xs font-bold tracking-widest text-brand-blue uppercase bg-brand-blue/5 px-4 py-1.5 rounded-full">
            Question {currentIndex + 1} of {total}
          </div>
          <h2 className="flex items-start justify-center gap-3 text-2xl sm:text-3xl font-sans font-medium text-zinc-900 mt-6 max-w-xl leading-snug">
            <MessageCircleQuestion className="w-8 h-8 text-brand-blue shrink-0 mt-1.5" />
            <span className="text-left">
              {currentQ.label}
            </span>
          </h2>
        </div>

        <div className="w-full max-w-lg mt-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {currentQ.type === "select" ? (
                <div className="text-left">
                  <SearchableSelect
                    value={answers[currentQ.key] || ""}
                    onChange={(val) => {
                      setAnswers((prev) => ({ ...prev, [currentQ.key]: val }));
                      if (val) setErrors((prev) => ({ ...prev, [currentQ.key]: false }));
                    }}
                    options={(currentQ.options || []).map((o) => ({ label: o, value: o }))}
                    placeholder="Select an option..."
                    showSearch={false}
                    className={errors[currentQ.key] ? "[&>button]:border-red-500 [&>button]:ring-1 [&>button]:ring-red-500" : ""}
                  />
                </div>
              ) : currentQ.type === "textarea" ? (
                <textarea
                  className={cn(enquireTextareaClass, "text-center placeholder:text-center min-h-[140px] text-lg")}
                  value={answers[currentQ.key] || ""}
                  placeholder="Type your answer here..."
                  aria-invalid={errors[currentQ.key]}
                  onChange={(e) => {
                    setAnswers((prev) => ({ ...prev, [currentQ.key]: e.target.value }));
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, [currentQ.key]: false }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleWizardNext();
                    }
                  }}
                />
              ) : (
                <input
                  className={cn(enquireInputClass, "text-center placeholder:text-center text-lg")}
                  value={answers[currentQ.key] || ""}
                  placeholder="Type your answer here..."
                  aria-invalid={errors[currentQ.key]}
                  onChange={(e) => {
                    setAnswers((prev) => ({ ...prev, [currentQ.key]: e.target.value }));
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, [currentQ.key]: false }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleWizardNext();
                    }
                  }}
                  autoFocus
                />
              )}
              {errors[currentQ.key] && (
                <p className="text-red-500 text-sm font-medium mt-3 text-center">
                  This question is required.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4 mt-8 w-full max-w-lg justify-between">
          <button
            type="button"
            onClick={handleWizardPrev}
            disabled={currentIndex === 0}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-colors text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <button
            type="button"
            onClick={handleWizardNext}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all bg-brand-blue text-white hover:bg-brand-blue/90 hover:scale-105 active:scale-95 shadow-md"
          >
            {currentIndex === total - 1 ? "Finish" : "Next"}
            {currentIndex !== total - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
