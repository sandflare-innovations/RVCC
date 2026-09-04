"use client";

import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  UploadCloud,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
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

  // Add service modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLongDescription, setNewLongDescription] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newFeatures, setNewFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Cover image upload in modal
  const modalCoverInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingModalCover, setIsUploadingModalCover] = useState(false);

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

  const handleUploadModalCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingModalCover(true);
    setCreateError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `services/${newSlug || "general"}`);
      formData.append("label", "service-cover");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setCreateError(await readApiError(res, "Could not upload service cover"));
        return;
      }

      const data = await res.json();
      if (data.fileUrl) {
        setNewImage(data.fileUrl);
      }
    } catch {
      setCreateError("Error uploading image");
    } finally {
      setIsUploadingModalCover(false);
      if (modalCoverInputRef.current) modalCoverInputRef.current.value = "";
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError("Please enter a service title.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim() || undefined,
          description: newDescription.trim(),
          longDescription: newLongDescription.trim(),
          image: newImage.trim(),
          features: newFeatures,
        }),
      });

      if (!res.ok) {
        setCreateError(await readApiError(res, "Failed to create service"));
        return;
      }

      const data = await res.json();
      if (data.service) {
        setServices((prev) => [data.service, ...prev]);
      }
      setCreateModalOpen(false);
      setNewTitle("");
      setNewSlug("");
      setNewDescription("");
      setNewLongDescription("");
      setNewImage("");
      setNewFeatures([]);
      router.refresh();
    } catch {
      setCreateError("Network error while creating service.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Sticky Top Header & Search Toolbar */}
      <div className="sticky top-0 z-30 -mx-5 -mt-6 md:-mx-8 md:-mt-9 mb-8 bg-white/95 px-5 md:px-8 py-3.5 backdrop-blur-md flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
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

        {/* Right Search Input & Add Service Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
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

          {canEdit && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Service</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Services Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-6">
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
                  className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all ${service.isActive
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 ring-1 ring-zinc-200"
                    }`}
                >
                  {isBusy ? (
                    <span className="h-3 w-3 rounded-full bg-zinc-400 animate-pulse" />
                  ) : (
                    <span
                      className={`h-2 w-2 rounded-full ${service.isActive ? "bg-emerald-500" : "bg-zinc-400"
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

      {/* Create New Service Modal */}
      {createModalOpen && (
        <Modal
          open={createModalOpen}
          onClose={() => !isCreating && setCreateModalOpen(false)}
          title="Add New Service"
          description="Create a new service offering for RVCC portfolio and marketing pages"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateService} className="space-y-4">
            {createError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Modern Landscaping"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">URL Slug (Optional)</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. modern-landscaping (auto-generated if empty)"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">Short Summary</label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief 1-2 sentence overview of the service..."
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">Long Description</label>
              <textarea
                rows={3}
                value={newLongDescription}
                onChange={(e) => setNewLongDescription(e.target.value)}
                placeholder="Detailed explanation of this service..."
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-xs font-bold text-zinc-700">Cover Image</label>
              <div className="mt-1.5 flex items-center gap-3">
                {newImage ? (
                  <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                    <Image src={newImage} alt="Cover preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-[11px] text-zinc-400">
                    No image
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => modalCoverInputRef.current?.click()}
                    disabled={isUploadingModalCover}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingModalCover ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5" />
                    )}
                    <span>{newImage ? "Change Image" : "Upload to Cloudflare"}</span>
                  </button>
                  <input
                    type="file"
                    ref={modalCoverInputRef}
                    accept="image/webp,image/png,image/jpeg"
                    onChange={handleUploadModalCover}
                    className="sr-only hidden"
                  />
                </div>
              </div>
            </div>

            {/* Features Tags */}
            <div>
              <label className="block text-xs font-bold text-zinc-700">Features / Capabilities</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {newFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#0073bc]"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => setNewFeatures((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-blue-400 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (featureInput.trim()) {
                        setNewFeatures((prev) => [...prev, featureInput.trim()]);
                        setFeatureInput("");
                      }
                    }
                  }}
                  placeholder="Type capability and press Enter..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-2xs placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (featureInput.trim()) {
                      setNewFeatures((prev) => [...prev, featureInput.trim()]);
                      setFeatureInput("");
                    }
                  }}
                  className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              <button
                type="button"
                disabled={isCreating}
                onClick={() => setCreateModalOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex items-center gap-2 rounded-xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] disabled:opacity-50 cursor-pointer"
              >
                {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isCreating ? "Creating..." : "Create Service"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
