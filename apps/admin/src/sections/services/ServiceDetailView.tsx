"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
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
import type { GalleryImageDTO, ServiceDTO } from "@rvcc/types";

export function ServiceDetailView({
  initialService,
}: {
  initialService: ServiceDTO;
}) {
  const router = useRouter();
  const [service, setService] = useState<ServiceDTO>(initialService);
  const [galleryImages, setGalleryImages] = useState<GalleryImageDTO[]>(
    initialService.galleryImages ?? []
  );

  // Edit meta state
  const [title, setTitle] = useState(service.title);
  const [description, setDescription] = useState(service.description);
  const [longDescription, setLongDescription] = useState(service.longDescription);
  const [coverImage, setCoverImage] = useState(service.image);
  const [features, setFeatures] = useState<string[]>(service.features || []);
  const [newFeature, setNewFeature] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cover image upload
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Gallery Picker Modal state (select/unselect images from gallery)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [allGalleryImages, setAllGalleryImages] = useState<GalleryImageDTO[]>([]);
  const [isLoadingAllGallery, setIsLoadingAllGallery] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set((initialService.galleryImages ?? []).map((img) => img.id))
  );
  const [pickerSearch, setPickerSearch] = useState("");
  const [isSavingPicker, setIsSavingPicker] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  // Delete single connected image modal
  const [imageToDelete, setImageToDelete] = useState<GalleryImageDTO | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures((prev) => [...prev, newFeature.trim()]);
    setNewFeature("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `services/${service.slug}`);
      formData.append("label", `${service.slug}-cover`);

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setErrorMessage(await readApiError(res, "Could not upload cover image"));
        return;
      }

      const data = await res.json();
      if (data.fileUrl) {
        setCoverImage(data.fileUrl);
      }
    } catch {
      setErrorMessage("Error uploading cover image.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleSaveMeta = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          longDescription,
          image: coverImage,
          features,
        }),
      });

      if (!res.ok) {
        setErrorMessage(await readApiError(res, "Failed to update service"));
        return;
      }

      const data = await res.json();
      if (data.service) {
        setService((prev) => ({ ...prev, ...data.service }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch {
      setErrorMessage("Network error — please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPicker = async () => {
    setIsPickerOpen(true);
    setPickerError(null);
    setSelectedImageIds(new Set(galleryImages.map((img) => img.id)));

    if (allGalleryImages.length === 0) {
      setIsLoadingAllGallery(true);
      try {
        const res = await fetch("/api/gallery");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.images)) {
            setAllGalleryImages(data.images);
          }
        }
      } catch (err) {
        console.error("Failed to load gallery images", err);
      } finally {
        setIsLoadingAllGallery(false);
      }
    }
  };

  const toggleSelectImage = (imgId: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(imgId)) {
        next.delete(imgId);
      } else {
        next.add(imgId);
      }
      return next;
    });
  };

  const filteredPickerImages = useMemo(() => {
    let list = allGalleryImages;
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      list = list.filter(
        (img) =>
          (img.caption && img.caption.toLowerCase().includes(q)) ||
          (img.projectTitle && img.projectTitle.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allGalleryImages, pickerSearch]);

  const handleSavePickerSelection = async () => {
    setIsSavingPicker(true);
    setPickerError(null);

    try {
      // Find which images were added and which were removed
      const currentIds = new Set(galleryImages.map((img) => img.id));
      const newlySelectedIds = Array.from(selectedImageIds).filter((id) => !currentIds.has(id));
      const removedIds = Array.from(currentIds).filter((id) => !selectedImageIds.has(id));

      const updatePromises: Promise<any>[] = [];

      // Add this service's slug to newly selected images
      for (const id of newlySelectedIds) {
        const targetImg = allGalleryImages.find((img) => img.id === id);
        const currentSlugs = targetImg?.serviceSlugs || [];
        const updatedSlugs = Array.from(new Set([...currentSlugs, service.slug]));

        updatePromises.push(
          fetch(`/api/gallery/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceSlugs: updatedSlugs }),
          })
        );
      }

      // Remove this service's slug from unselected images
      for (const id of removedIds) {
        const targetImg = allGalleryImages.find((img) => img.id === id) || galleryImages.find((img) => img.id === id);
        const currentSlugs = targetImg?.serviceSlugs || [];
        const updatedSlugs = currentSlugs.filter((s) => s !== service.slug);

        updatePromises.push(
          fetch(`/api/gallery/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceSlugs: updatedSlugs }),
          })
        );
      }

      await Promise.all(updatePromises);

      // Re-populate local connected images
      const updatedGalleryList = allGalleryImages.filter((img) => selectedImageIds.has(img.id));
      setGalleryImages(updatedGalleryList);
      setIsPickerOpen(false);
      router.refresh();
    } catch {
      setPickerError("Failed to update service images.");
    } finally {
      setIsSavingPicker(false);
    }
  };

  const handleDeleteGalleryImage = async () => {
    if (!imageToDelete) return;
    setIsDeletingImage(true);

    try {
      const res = await fetch(`/api/gallery/${imageToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setGalleryImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
        setImageToDelete(null);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setIsDeletingImage(false);
    }
  };

  return (
    <>
      {/* Sticky Top Header Toolbar */}
      <div className="sticky top-0 z-30 -mx-5 -mt-5 md:-mx-8 md:-mt-8 mb-6 border-b border-zinc-200/80 bg-white/95 px-5 md:px-8 py-3.5 backdrop-blur-md flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/content/services"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Back to services"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Wrench className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950">{service.title}</h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {service.slug}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Service details, description, capabilities, and all connected gallery images
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/content/gallery`}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
          >
            Open in Gallery
          </Link>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveMeta}
            className="flex items-center gap-2 rounded-2xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>Service information saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-bold text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Section: Main Cover Image (Left) + Service Descriptions & Features (Right) */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Cover Image Box (5 cols) */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs h-full flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cover Image</h3>
            <div className="mt-3 relative aspect-16/10 w-full flex-1 min-h-[240px] overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-100 group">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 35vw, 100vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 font-medium">
                  No image set
                </div>
              )}

              {/* Change Cover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-900 shadow-md hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  {uploadingCover ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5" />
                  )}
                  <span>Change Image</span>
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={coverInputRef}
              accept="image/webp,image/png,image/jpeg"
              onChange={handleCoverUpload}
              className="sr-only hidden"
            />
          </div>
        </div>

        {/* Right Column: Titles, Descriptions & Capabilities (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700">Service Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">Short Summary</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">Detailed Description</label>
              <textarea
                rows={3}
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 shadow-2xs focus:border-[#0073bc] focus:outline-hidden"
              />
            </div>

            {/* Features Tags List */}
            <div>
              <label className="block text-xs font-bold text-zinc-700">Key Features / Capabilities</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#0073bc]"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-blue-400 hover:text-blue-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="Add capability e.g. UV-Resistant Fibers..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-800 shadow-2xs placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Connected Gallery Section / Inline Selection */}
      <div className="mt-10 space-y-4">
        {/* Header Row: Title on Left, and Controls (Search + Add Images / Save Selection) on Right in the same row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-950">
                Connected Gallery Images ({isPickerOpen ? selectedImageIds.size : galleryImages.length})
              </h2>
              {isPickerOpen && (
                <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-[#0073bc]">
                  Editing Selection
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {isPickerOpen
                ? "Click any image card to select or unselect it for this service"
                : "All photos currently assigned to this service across all projects"}
            </p>
          </div>

          {/* Action Controls in the Same Row */}
          <div className="flex items-center gap-2.5">
            {isPickerOpen ? (
              <>
                {/* Search Bar */}
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search gallery..."
                    className="w-full rounded-xl border border-zinc-200 bg-white py-1.5 pl-8 pr-8 text-xs font-medium text-zinc-800 shadow-2xs placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-hidden"
                  />
                  {pickerSearch && (
                    <button
                      type="button"
                      onClick={() => setPickerSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSavingPicker}
                  onClick={() => setIsPickerOpen(false)}
                  className="rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingPicker}
                  onClick={handleSavePickerSelection}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPicker && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSavingPicker ? "Saving..." : "Done"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleOpenPicker}
                className="flex items-center gap-1.5 rounded-2xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Add Images</span>
              </button>
            )}
          </div>
        </div>

        {pickerError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{pickerError}</span>
          </div>
        )}

        {/* The Photos Grid: Preserves the exact same card box designs */}
        {!isPickerOpen ? (
          galleryImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-50">
                    <Image
                      src={img.imageUrl}
                      alt={img.caption || service.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width: 1024px) 25vw, 50vw"
                    />

                    {/* Delete hover button */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setImageToDelete(img)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2.5">
                    <h4 className="line-clamp-1 text-xs font-bold text-zinc-900">
                      {img.caption || "Gallery Photo"}
                    </h4>
                    {img.projectTitle && (
                      <span className="mt-0.5 line-clamp-1 text-[11px] font-medium text-[#0073bc]">
                        {img.projectTitle}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                <ImageIcon className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-zinc-800">No images tagged with this service</h4>
              <p className="mt-1 max-w-xs text-xs text-zinc-500">
                Click "Add Images" above to select existing gallery photos for this service.
              </p>
              <button
                type="button"
                onClick={handleOpenPicker}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Select Images from Gallery</span>
              </button>
            </div>
          )
        ) : (
          /* Selection Mode: Same card box design, clickable with blue borders */
          isLoadingAllGallery ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#0073bc]" />
              <span className="mt-3 text-xs font-semibold text-zinc-500">
                Loading gallery collection...
              </span>
            </div>
          ) : filteredPickerImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredPickerImages.map((img) => {
                const isSelected = selectedImageIds.has(img.id);

                return (
                  <button
                    type="button"
                    key={img.id}
                    onClick={() => toggleSelectImage(img.id)}
                    className={`group relative flex flex-col justify-between text-left overflow-hidden rounded-2xl border-2 bg-white p-3 shadow-xs transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-[#0073bc] ring-2 ring-[#0073bc]/30 shadow-md"
                        : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-md"
                    }`}
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-50">
                      <Image
                        src={img.imageUrl}
                        alt={img.caption || service.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(min-width: 1024px) 25vw, 50vw"
                      />

                      {/* Top Selection Indicator */}
                      <div className="absolute top-2 right-2 z-10">
                        {isSelected ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0073bc] text-white shadow-md">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-white/90 bg-black/30 backdrop-blur-xs transition-colors group-hover:bg-black/50" />
                        )}
                      </div>

                      {/* Selection tint overlay */}
                      <div
                        className={`absolute inset-0 transition-opacity ${
                          isSelected
                            ? "bg-[#0073bc]/10"
                            : "bg-black/0 group-hover:bg-black/20"
                        }`}
                      />
                    </div>

                    <div className="pt-2.5">
                      <h4 className="line-clamp-1 text-xs font-bold text-zinc-900">
                        {img.caption || "Gallery Photo"}
                      </h4>
                      {img.projectTitle && (
                        <span className="mt-0.5 line-clamp-1 text-[11px] font-medium text-[#0073bc]">
                          {img.projectTitle}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50">
              <ImageIcon className="h-10 w-10 text-zinc-300" />
              <h4 className="mt-2 text-xs font-bold text-zinc-700">No gallery images found</h4>
              <p className="mt-1 text-[11px] text-zinc-400">Try adjusting your search filter.</p>
            </div>
          )
        )}
      </div>

      {/* Delete Image Confirmation Modal */}
      {imageToDelete && (
        <Modal
          open={Boolean(imageToDelete)}
          onClose={() => !isDeletingImage && setImageToDelete(null)}
          title="Delete Gallery Image"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Are you sure you want to remove this gallery photo? It will be removed from this service
              and from the site gallery.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingImage}
                onClick={() => setImageToDelete(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingImage}
                onClick={handleDeleteGalleryImage}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingImage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isDeletingImage ? "Deleting..." : "Delete Photo"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
