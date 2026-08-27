"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, RotateCcw } from "lucide-react";
import { ProcurementStore } from "@/lib/storage";

interface NavbarProps {
  onOpenNewRequest?: () => void;
  onRefreshData?: () => void;
}

export function Navbar({ onOpenNewRequest, onRefreshData }: NavbarProps) {
  const handleReset = () => {
    if (confirm("Reset procurement data to demo defaults?")) {
      ProcurementStore.resetToDefault();
      if (onRefreshData) onRefreshData();
      else window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-28 flex items-center">
            <Image
              src="/images/logo/logo.webp"
              alt="RVCC Logo"
              width={112}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              RVCC <span className="text-[#0073bc] font-semibold">Procurement</span>
            </span>
          </div>
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            title="Reset Mock Data"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {onOpenNewRequest && (
            <button
              onClick={onOpenNewRequest}
              className="flex items-center gap-2 rounded-xl bg-[#0073bc] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#005f9e] active:scale-98 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Requisition</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
