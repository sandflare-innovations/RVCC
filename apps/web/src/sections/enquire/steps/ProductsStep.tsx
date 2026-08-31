"use client";

import { cn } from "@lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LuCircle as Circle,LuCircleCheck as CheckCircle2 } from "react-icons/lu";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";

export function ProductsStep() {
  useRequireSession("products");
  const router = useRouter();
  const { registration, saveDraft, advanceTo, loading, saving } = useEnquire();
  // Which action is in flight, so only that button shows a spinner.
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<
    { id: string; value: string; active: boolean }[]
  >([]);
  const [error, setError] = useState(false);
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderNode(document.getElementById("enquire-header-actions"));
  }, []);

  useEffect(() => {
    if (registration?.productCategories) {
      const standardIds = ENQUIRE_CATEGORIES.map((c) => c.id).filter(
        (id) => id !== "other"
      ) as string[];
      const standardSelected = registration.productCategories.filter((c) =>
        standardIds.includes(c)
      );
      const customStrings = registration.productCategories.filter(
        (c) => !standardIds.includes(c) && c !== "other" && c !== "Other Goods & Services"
      );

      setSelected(standardSelected);

      const initialCustoms = customStrings.map((val, i) => ({
        id: `custom-init-${i}`,
        value: val,
        active: true,
      }));
      setCustomFields([
        ...initialCustoms,
        { id: `custom-new-${Date.now()}`, value: "", active: false },
      ]);
    } else {
      setCustomFields([{ id: `custom-new-${Date.now()}`, value: "", active: false }]);
    }
  }, [registration]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length > 0 || customFields.some((f) => f.active && f.value.trim() !== ""))
        setError(false);
      return next;
    });
  };

  const getFinalCategories = () => {
    const final = selected.filter((x) => x !== "other");
    const validCustoms = customFields
      .filter((f) => f.active && f.value.trim() !== "")
      .map((f) => f.value.trim());
    return [...final, ...validCustoms];
  };

  const saveLater = async () => {
    setPendingAction("save");
    await saveDraft({ step: "products", productCategories: getFinalCategories() });
    setPendingAction(null);
  };

  const goNext = () => {
    const final = getFinalCategories();
    if (final.length === 0) {
      setError(true);
      return;
    }
    setError(false);
    advanceTo("questionnaire", { productCategories: final });
  };

  const actions = (
    <>
      <InteractiveHoverButton
        type="button"
        variant="outline"
        className="h-10 min-w-[120px] px-6 text-xs sm:w-auto sm:text-xs"
        disabled={saving}
        pending={pendingAction === "save"}
        onClick={() => void saveLater()}
      >
        Draft
      </InteractiveHoverButton>
      <InteractiveHoverButton
        type="button"
        variant="solid"
        className="h-10 min-w-[120px] px-6 text-xs sm:w-auto sm:text-xs"
        onClick={goNext}
      >
        Next
      </InteractiveHoverButton>
    </>
  );

  if (loading && !registration) return null;

  return (
    <div className="space-y-8">
      {headerNode && createPortal(actions, headerNode)}

      <div className="animate-fade-in grid gap-3 sm:grid-cols-2">
        {ENQUIRE_CATEGORIES.filter((c) => c.id !== "other").map((cat) => {
          const on = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={cn(
                "group relative flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-200",
                on
                  ? "border-brand-blue bg-brand-blue ring-brand-blue text-white shadow-md ring-1"
                  : "hover:border-brand-blue/40 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm",
                error &&
                  !on &&
                  selected.length === 0 &&
                  !customFields.some((f) => f.active && f.value.trim() !== "") &&
                  "border-red-500 ring-1 ring-red-500 hover:border-red-500"
              )}
            >
              <div className="pr-4 text-[15px] font-medium">{cat.label}</div>
              <div
                className={cn(
                  "flex-shrink-0 transition-all duration-200",
                  on ? "scale-110 text-white" : "group-hover:text-brand-blue/40 text-zinc-300"
                )}
              >
                {on ? (
                  <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2} />
                ) : (
                  <Circle className="h-6 w-6" strokeWidth={1.5} />
                )}
              </div>
            </button>
          );
        })}

        {customFields.map((field, index) => {
          const isLast = index === customFields.length - 1;
          const on = field.active;

          return (
            <button
              key={field.id}
              type="button"
              onClick={() => {
                if (!on) {
                  const newFields = [...customFields];
                  newFields[index].active = true;
                  setCustomFields(newFields);
                  setError(false);
                }
              }}
              className={cn(
                "group relative flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-200",
                on
                  ? "border-brand-blue bg-brand-blue ring-brand-blue text-white shadow-md ring-1"
                  : "hover:border-brand-blue/40 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:shadow-sm",
                error &&
                  !on &&
                  selected.length === 0 &&
                  !customFields.some((f) => f.active && f.value.trim() !== "") &&
                  "border-red-500 ring-1 ring-red-500 hover:border-red-500"
              )}
            >
              <div className="w-full flex-1 pr-4 text-[15px] font-medium">
                {on ? (
                  <div className="relative z-10 flex w-full items-center gap-2 pr-4">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...customFields];
                        newFields[index].value = e.target.value;
                        setCustomFields(newFields);
                      }}
                      onBlur={() => {
                        if (field.value.trim() === "") {
                          const newFields = [...customFields];
                          if (isLast) {
                            newFields[index].active = false;
                          } else {
                            newFields.splice(index, 1);
                          }
                          setCustomFields(newFields);
                        } else {
                          if (isLast) {
                            const newFields = [...customFields];
                            newFields.push({
                              id: `custom-new-${Date.now()}`,
                              value: "",
                              active: false,
                            });
                            setCustomFields(newFields);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="Type your service..."
                      autoFocus
                      className="w-full border-b border-white/40 bg-transparent py-1 text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  "Other Goods & Services"
                )}
              </div>
              <div
                onClick={(e) => {
                  if (on) {
                    e.stopPropagation();
                    const newFields = [...customFields];
                    if (isLast) {
                      newFields[index].active = false;
                      newFields[index].value = "";
                    } else {
                      newFields.splice(index, 1);
                    }
                    setCustomFields(newFields);
                  }
                }}
                className={cn(
                  "flex-shrink-0 cursor-pointer transition-all duration-200",
                  on ? "scale-110 text-white" : "group-hover:text-brand-blue/40 text-zinc-300"
                )}
              >
                {on ? (
                  <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2} />
                ) : (
                  <Circle className="h-6 w-6" strokeWidth={1.5} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error &&
        selected.length === 0 &&
        !customFields.some((f) => f.active && f.value.trim() !== "") && (
          <p className="mt-4 text-sm font-medium text-red-500">
            Please select at least one category to continue.
          </p>
        )}
    </div>
  );
}
