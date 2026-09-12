"use client";

import type { HeroSlideDTO, HeroSlideInput } from "@rvcc/schemas";
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  FileText,
  Home,
  Image as ImageIcon,
  Info,
  Loader2,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  UserCheck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { HeroSlidesGrid } from "./HeroSlidesGrid";

export type PageHeroKey =
  | "home"
  | "about"
  | "services"
  | "projects"
  | "careers"
  | "clients"
  | "documents"
  | "quality-policy"
  | "contact"
  | "gallery";

interface PageHeroConfig {
  key: PageHeroKey;
  label: string;
  icon: React.ElementType;
  defaultBadge: string;
  defaultTitle1: string;
  defaultTitle2: string;
  defaultDescription: string;
  defaultImageUrl: string;
}

export const PAGE_HERO_CONFIGS: PageHeroConfig[] = [
  {
    key: "home",
    label: "Home Slides",
    icon: Home,
    defaultBadge: "Architecture & Design",
    defaultTitle1: "BUILDING THE",
    defaultTitle2: "KINGDOM'S FUTURE",
    defaultDescription: "Refined engineering and timeless structural execution across Saudi Arabia.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-1.webp",
  },
  {
    key: "about",
    label: "About",
    icon: Info,
    defaultBadge: "Architecture & Design",
    defaultTitle1: "THE ART OF",
    defaultTitle2: "STRUCTURAL PERFECTION",
    defaultDescription: "For nearly two decades, Riyadh Villas Contracting Company (RVCC) has stood as a beacon of refined engineering and timeless structural design.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-1.webp",
  },
  {
    key: "services",
    label: "Services",
    icon: Wrench,
    defaultBadge: "OUR SERVICES",
    defaultTitle1: "SHAPING",
    defaultTitle2: "THE FUTURE",
    defaultDescription: "Delivering excellence through innovative architectural solutions and precision engineering since 2006.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-2.webp",
  },
  {
    key: "projects",
    label: "Projects",
    icon: Briefcase,
    defaultBadge: "PORTFOLIO",
    defaultTitle1: "LANDMARK",
    defaultTitle2: "DEVELOPMENTS",
    defaultDescription: "Explore our portfolio of premier commercial, residential, and infrastructure achievements across the Kingdom.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-3.webp",
  },
  {
    key: "careers",
    label: "Careers",
    icon: Building2,
    defaultBadge: "EVOLVE WITH US",
    defaultTitle1: "ARCHITECT",
    defaultTitle2: "THE FUTURE",
    defaultDescription: "Join a team of visionaries and creators dedicated to reshaping the skyline of the Kingdom through monumental design and engineering.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-4.webp",
  },
  {
    key: "clients",
    label: "Clients",
    icon: UserCheck,
    defaultBadge: "PARTNERSHIPS",
    defaultTitle1: "TRUSTED BY",
    defaultTitle2: "INDUSTRY LEADERS",
    defaultDescription: "Proudly collaborating with the Kingdom's leading enterprises, ministries, and developers to deliver iconic infrastructure.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-1.webp",
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
    defaultBadge: "TECHNICAL REPOSITORY",
    defaultTitle1: "COMPANY PROFILES",
    defaultTitle2: "& PREQUALIFICATIONS",
    defaultDescription: "Access official documentation, corporate brochures, and pre-qualification credentials.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-2.webp",
  },
  {
    key: "quality-policy",
    label: "Quality Policy",
    icon: ShieldCheck,
    defaultBadge: "STANDARDS & EXCELLENCE",
    defaultTitle1: "SAFETY &",
    defaultTitle2: "QUALITY ASSURANCE",
    defaultDescription: "Certified excellence under ISO standards, upholding uncompromised safety and precision across every construction site.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-3.webp",
  },
  {
    key: "contact",
    label: "Contact",
    icon: Phone,
    defaultBadge: "COMMUNICATION",
    defaultTitle1: "CONNECT",
    defaultTitle2: "WITH RVCC",
    defaultDescription: "Reach out to our engineering and executive teams in Riyadh to initiate your next landmark development.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-2.webp",
  },
  {
    key: "gallery",
    label: "Gallery",
    icon: ImageIcon,
    defaultBadge: "VISUAL CHRONICLES",
    defaultTitle1: "CURATED",
    defaultTitle2: "WORKS & MEDIA",
    defaultDescription: "Immerse in detailed architectural captures showcasing our craft, materiality, and structural execution.",
    defaultImageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-4.webp",
  },
];

interface HeroSectionManagerProps {
  initialSlides: HeroSlideDTO[];
  canDelete?: boolean;
}

export function HeroSectionManager({ initialSlides = [], canDelete = true }: HeroSectionManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PageHeroKey>("home");
  const [slides, setSlides] = useState<HeroSlideDTO[]>(initialSlides);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSlides = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/hero-slides?page=all", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.slides)) {
          setSlides(json.slides);
        }
      }
    } catch (err) {
      console.error("[HeroSectionManager] failed to fetch slides:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    if (initialSlides && initialSlides.length > 0) {
      setSlides(initialSlides);
    }
  }, [initialSlides]);

  // Multi-slide home slides state
  const homeSlides = slides.filter((s) => !s.page || s.page === "home");

  // Page-specific hero forms mapped by page key
  const [pageForms, setPageForms] = useState<Record<string, HeroSlideInput>>(() => {
    const map: Record<string, HeroSlideInput> = {};
    for (const cfg of PAGE_HERO_CONFIGS) {
      if (cfg.key === "home") continue;
      const found = initialSlides.find((s) => s.page === cfg.key);
      map[cfg.key] = {
        page: cfg.key,
        badge: found?.badge ?? cfg.defaultBadge,
        title1: found?.title1 ?? cfg.defaultTitle1,
        title2: found?.title2 ?? cfg.defaultTitle2,
        description: found?.description ?? cfg.defaultDescription,
        imageUrl: found?.imageUrl ?? cfg.defaultImageUrl,
        primaryBtnText: found?.primaryBtnText ?? undefined,
        primaryBtnLink: found?.primaryBtnLink ?? undefined,
        secondaryBtnText: found?.secondaryBtnText ?? undefined,
        secondaryBtnLink: found?.secondaryBtnLink ?? undefined,
        isActive: found?.isActive ?? true,
      };
    }
    return map;
  });

  useEffect(() => {
    if (slides && slides.length > 0) {
      setPageForms((prev) => {
        const map: Record<string, HeroSlideInput> = { ...prev };
        for (const cfg of PAGE_HERO_CONFIGS) {
          if (cfg.key === "home") continue;
          const found = slides.find((s) => s.page === cfg.key);
          if (found) {
            map[cfg.key] = {
              page: cfg.key,
              badge: found.badge ?? cfg.defaultBadge,
              title1: found.title1 ?? cfg.defaultTitle1,
              title2: found.title2 ?? cfg.defaultTitle2,
              description: found.description ?? cfg.defaultDescription,
              imageUrl: found.imageUrl ?? cfg.defaultImageUrl,
              primaryBtnText: found.primaryBtnText ?? undefined,
              primaryBtnLink: found.primaryBtnLink ?? undefined,
              secondaryBtnText: found.secondaryBtnText ?? undefined,
              secondaryBtnLink: found.secondaryBtnLink ?? undefined,
              isActive: found.isActive ?? true,
            };
          }
        }
        return map;
      });
    }
  }, [slides]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentConfig = PAGE_HERO_CONFIGS.find((c) => c.key === activeTab) || PAGE_HERO_CONFIGS[0];
  const CurrentIcon = currentConfig.icon;
  const currentForm = pageForms[activeTab] || {
    page: activeTab,
    badge: currentConfig.defaultBadge,
    title1: currentConfig.defaultTitle1,
    title2: currentConfig.defaultTitle2,
    description: currentConfig.defaultDescription,
    imageUrl: currentConfig.defaultImageUrl,
    isActive: true,
  };

  const handleFieldChange = <K extends keyof HeroSlideInput>(field: K, value: HeroSlideInput[K]) => {
    setPageForms((prev) => ({
      ...prev,
      [activeTab]: {
        ...currentForm,
        [field]: value,
      },
    }));
  };

  const handleSavePageHero = async () => {
    if (activeTab === "home") return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/hero-slides/page/${encodeURIComponent(activeTab)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentForm),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save ${currentConfig.label} hero.`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchSlides();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving hero section.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", `hero/${activeTab}`);

      const res = await fetch("/api/about/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to upload image to storage.");
      }

      const { url } = await res.json();
      handleFieldChange("imageUrl", url);
    } catch (err: any) {
      setError(err.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar with Custom Page Selector Dropdown & Action Controls */}
      <div className="flex flex-col gap-4 border-b border-zinc-200/80 bg-white pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Custom Page Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:inline-block">
              Page:
            </span>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer shadow-xs ${
                dropdownOpen
                  ? "border-[#0073bc] ring-2 ring-[#0073bc]/20 bg-white text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0073bc]/10 text-[#0073bc]">
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">{currentConfig.label}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                    {currentConfig.key === "home" ? "Multi-Slide" : "Hero Banner"}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`ml-2 h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-[#0073bc]" : ""
                }`}
              />
            </button>
          </div>

          {/* Dropdown Menu Popup */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Select Page Hero Section
                </p>
              </div>
              <div className="max-h-[340px] overflow-y-auto space-y-1 [scrollbar-width:thin]">
                {PAGE_HERO_CONFIGS.map((cfg) => {
                  const Icon = cfg.icon;
                  const isSelected = activeTab === cfg.key;

                  return (
                    <button
                      key={cfg.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(cfg.key);
                        setDropdownOpen(false);
                        setError(null);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#0073bc]/10 text-[#0073bc]"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-[#0073bc] text-white"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-bold">{cfg.label}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            {cfg.key === "home" ? "Multi-slide carousel" : "Single hero banner"}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0073bc] text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Top Action Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {activeTab === "home" ? (
            <Link
              href="/content/hero/new"
              className="flex items-center gap-2 rounded-xl bg-[#0073bc] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#005fa0] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Slide</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSavePageHero}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Tab Content Display */}
      {activeTab === "home" ? (
        /* Home Multi-Slide Interactive Grid */
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">
              Interactive Homepage Slides ({homeSlides.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Drag slides to reorder. Active slides will appear on the homepage hero carousel.
            </p>
          </div>
          <HeroSlidesGrid initialSlides={homeSlides} canDelete={canDelete} />
        </div>
      ) : (
        /* Single Page Hero Banner Editor */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Form Settings */}
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-5">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-base font-bold text-zinc-900">
                  {currentConfig.label} Page Hero Configuration
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Configure the primary header titles, badge tag, and backdrop banner for the {currentConfig.label} page.
                </p>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Top Badge / Category Tag
                </label>
                <input
                  type="text"
                  value={currentForm.badge ?? ""}
                  onChange={(e) => handleFieldChange("badge", e.target.value)}
                  placeholder="e.g. OUR SERVICES"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                />
              </div>

              {/* Title 1 & Title 2 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Title 1 (Primary Header) *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentForm.title1}
                    onChange={(e) => handleFieldChange("title1", e.target.value)}
                    placeholder="e.g. SHAPING"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Title 2 (Secondary Header) *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentForm.title2}
                    onChange={(e) => handleFieldChange("title2", e.target.value)}
                    placeholder="e.g. THE FUTURE"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Description / Narrative *
                </label>
                <textarea
                  rows={3}
                  required
                  value={currentForm.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Enter high-level page introduction..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                />
              </div>

              {/* Background Media Upload */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Hero Background Image (Cloudflare R2) *
                </label>
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={currentForm.imageUrl}
                      onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
                      placeholder="https://pub-....r2.dev/hero/..."
                      className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/webp,image/jpeg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#0073bc]" />
                      ) : (
                        <UploadCloud className="h-4 w-4 text-[#0073bc]" />
                      )}
                      <span>{isUploadingImage ? "Uploading..." : "Upload"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Recommended dimensions: 1920x1080 (16:9) in WebP format for optimal loading performance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Mockup Preview */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
                Live Architectural Preview
              </h4>

              {/* Realistic Preview Card */}
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-md">
                {currentForm.imageUrl ? (
                  <Image
                    src={currentForm.imageUrl}
                    alt={currentForm.title1 || "Hero background"}
                    fill
                    className="object-cover opacity-60"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-600 text-xs">
                    No backdrop image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                  <div className="mb-2 flex items-center space-x-2">
                    <div className="h-0.5 w-6 bg-white" />
                    <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/90">
                      {currentForm.badge || currentConfig.defaultBadge}
                    </span>
                  </div>

                  <h2 className="font-heading text-xl font-normal uppercase leading-tight tracking-tight">
                    {currentForm.title1 || currentConfig.defaultTitle1} <br />
                    <span className="text-[#0073bc]">{currentForm.title2 || currentConfig.defaultTitle2}</span>
                  </h2>

                  <p className="mt-2 line-clamp-2 text-[11px] font-light leading-relaxed text-zinc-300">
                    {currentForm.description || currentConfig.defaultDescription}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 text-xs text-zinc-600">
                <span className="font-bold text-zinc-900">Page Link: </span>
                <span className="font-mono text-zinc-500">/{activeTab}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
