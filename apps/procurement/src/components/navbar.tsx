"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";

interface NavbarProps {
  onOpenNewRequest?: () => void;
  onRefreshData?: () => void;
}

export function Navbar({ onOpenNewRequest }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
          <div className="h-6 w-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-zinc-900">
              RVCC <span className="text-[#0073bc] font-semibold">Procurement</span>
            </span>
          </div>
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* PWA Install Button */}
          <PwaInstallButton />

          {onOpenNewRequest && (
            <button
              onClick={onOpenNewRequest}
              className="flex items-center gap-1.5 rounded-full bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005f9e] active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Requisition</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
