"use client";

import {
  ArrowRight,
  ChevronLeft,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { ServiceDTO } from "@rvcc/types";

export function ServicesGrid({
  initialServices,
  canEdit = true,
}: {
  initialServices: ServiceDTO[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceDTO[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyServiceId, setBusyServiceId] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    let list = [...services];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.features.some((f) => f.toLowerCase().includes(q))
      );
    }
    return list;
  }, [services, searchQuery]);

  const toggleActive = async (service: ServiceDTO) => {
    setBusyServiceId(service.id);
    const newStatus = !service.isActive;

    // Optimistic update
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, isActive: newStatus } : s))
    );

    try {
      await fetch(`/api/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      router.refresh();
    } catch {
      // Revert on error
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: service.isActive } : s))
      );
    } finally {
      setBusyServiceId(null);
    }
  };

  return (
    <>
      {/* Top Header & Search Toolbar */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Wrench className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950">Services</h1>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                  {services.length} {services.length === 1 ? "Service" : "Services"}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Click any service card to view details, edit content, and view all connected gallery photos
              </p>
            </div>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service title, features..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2 pl-9 pr-9 text-xs font-medium text-zinc-800 shadow-2xs placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modern Services Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service, index) => {
          const isBusy = busyServiceId === service.id;
          const galleryCount = service._count?.galleryImages ?? service.galleryImages?.length ?? 0;

          return (
            <div
              key={service.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:border-zinc-300 hover:shadow-xl"
            >
              <div>
                {/* Clickable Image Box */}
                <Link
                  href={`/content/services/${service.id}`}
                  className="block relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-inner border border-zinc-100 group/link"
                >
                  {service.image ? (
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover/link:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-400">
                      No cover image
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-800 uppercase shadow-xs backdrop-blur-md">
                      Service
                    </span>
                    <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Connected Gallery Images Count Badge */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                    <ImageIcon className="h-3 w-3" />
                    <span>
                      {galleryCount} Gallery {galleryCount === 1 ? "Photo" : "Photos"}
                    </span>
                  </div>
                </Link>

                {/* Service Details */}
                <div className="pt-4">
                  <Link
                    href={`/content/services/${service.id}`}
                    className="block group-hover:text-[#0073bc] transition-colors"
                  >
                    <h3 className="line-clamp-1 text-base font-bold text-zinc-900">
                      {service.title}
                    </h3>
                  </Link>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {service.description || "No summary provided."}
                  </p>

                  {/* Feature Tags Preview */}
                  {service.features && service.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {service.features.slice(0, 3).map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                        >
                          {feat}
                        </span>
                      ))}
                      {service.features.length > 3 && (
                        <span className="rounded-lg bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                          +{service.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Strip */}
              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3">
                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() => toggleActive(service)}
                  disabled={isBusy || !canEdit}
                  title={service.isActive ? "Hide service from website" : "Show service on website"}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all ${
                    service.isActive
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 ring-1 ring-zinc-200"
                  }`}
                >
                  {isBusy ? (
                    <span className="h-3 w-3 rounded-full bg-zinc-400 animate-pulse" />
                  ) : (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        service.isActive ? "bg-emerald-500" : "bg-zinc-400"
                      }`}
                    />
                  )}
                  <span>{service.isActive ? "Live" : "Draft"}</span>
                </button>

                {/* View Detail & Images Link */}
                <Link
                  href={`/content/services/${service.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0073bc] hover:underline"
                >
                  <span>View Details & Photos</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800">No services match your search</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Try adjusting your search query or clear the filter.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 rounded-xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0]"
          >
            Clear Search
          </button>
        </div>
      )}
    </>
  );
}
