"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ENQUIRE_CATEGORIES } from "@/data/enquire-categories";
import { useEnquire, useRequireSession } from "@/sections/enquire/EnquireContext";

import { cn } from "@lib/utils";

export function ProductsStep() {
  useRequireSession("products");
  const router = useRouter();
  const { registration, saveDraft, loading } = useEnquire();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (registration?.productCategories) setSelected(registration.productCategories);
  }, [registration]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const persist = async (next: string) => {
    const ok = await saveDraft({ step: next, productCategories: selected });
    if (ok) router.push(`/enquire/${next}`);
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">
        Select all categories of goods and services you can supply to RVCC.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {ENQUIRE_CATEGORIES.map((cat) => {
          const on = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={cn(
                "border px-4 py-4 text-left text-sm transition-colors",
                on
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "hover:border-brand-blue/40 border-zinc-200 text-zinc-700"
              )}
            >
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
                {on ? "Selected" : "Select"}
              </span>
              <div className="mt-1 font-medium">{cat.label}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => router.push("/enquire/bank")}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="brand-outline"
          className="h-14 rounded-none"
          onClick={() => void persist("products")}
        >
          Save for Later
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-14 rounded-none"
          onClick={() => void persist("questionnaire")}
        >
          Next: Questionnaire
        </Button>
      </div>
    </div>
  );
}
