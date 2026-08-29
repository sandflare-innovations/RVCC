"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { UserProfileMenu } from "./user-profile-menu";

interface NavbarProps {
  onOpenNewRequest?: () => void;
  onRefreshData?: () => void;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export function Navbar({ onOpenNewRequest, user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Placeholder for balanced symmetry */}
        <div className="flex items-center gap-2.5 w-28 sm:w-44" />

        {/* Center Brand / Logo */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 group"
        >
          <div className="relative h-10 w-28 flex items-center justify-center">
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
        <div className="flex items-center justify-end gap-3 w-28 sm:w-44">
          <PwaInstallButton />
          <UserProfileMenu user={user} />
        </div>
      </div>
    </header>
  );
}

