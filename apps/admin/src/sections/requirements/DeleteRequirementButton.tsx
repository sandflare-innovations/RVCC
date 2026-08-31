"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteRequirementConfirmModal } from "./DeleteRequirementConfirmModal";

export function DeleteRequirementButton({
  id,
  projectName,
}: {
  id: string;
  projectName: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50/50 px-4 text-sm font-semibold text-rose-700 shadow-sm transition-all hover:bg-rose-100 hover:border-rose-300 focus:ring-[3px] focus:ring-rose-200"
      >
        <Trash2 className="h-4 w-4" />
        <span>Delete Requirement</span>
      </button>

      <DeleteRequirementConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        id={id}
        projectName={projectName}
        onDeleted={() => {
          router.push("/requirements");
          router.refresh();
        }}
      />
    </>
  );
}
