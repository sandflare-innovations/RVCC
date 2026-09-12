"use client";

import type { AboutContentDTO, AboutContentInput, AboutStatMetric, HomeStatItem } from "@rvcc/schemas";
import {
  Check,
  Film,
  Hash,
  Image as ImageIcon,
  Info,
  Loader2,
  Plus,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface AboutContentEditorProps {
  initialContent: AboutContentDTO;
}

export function AboutContentEditor({ initialContent }: AboutContentEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"video" | "homeStats" | "aboutStats" | "overview">("video");
  const [form, setForm] = useState<AboutContentInput>({
    videoUrl: initialContent.videoUrl,
    videoPosterUrl: initialContent.videoPosterUrl,
    homeStats: initialContent.homeStats ?? [],
    aboutStats: initialContent.aboutStats ?? [],
    overviewImages: initialContent.overviewImages ?? [],
    overviewTitle: initialContent.overviewTitle ?? "The Art of Structural Perfection.",
    overviewSubtitle: initialContent.overviewSubtitle ?? "Company Profile",
    overviewDescription1: initialContent.overviewDescription1 ?? "",
    overviewDescription2: initialContent.overviewDescription2 ?? "",
    classABadge: initialContent.classABadge ?? "Class A",
    classADescription: initialContent.classADescription ?? "Ministry Accredited Excellence",
    deliveriesCount: initialContent.deliveriesCount ?? "150+",
    yearsCount: initialContent.yearsCount ?? "20+",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [targetImageSlot, setTargetImageSlot] = useState<number>(0);

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save about content.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Upload video
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("type", "video");

      const res = await fetch("/api/about/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Video upload failed.");
      }

      const json = await res.json();
      setForm((prev) => ({ ...prev, videoUrl: json.fileUrl }));
    } catch (err: any) {
      setError(err.message || "Failed to upload video.");
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  // Upload overview slider image
  const handleOverviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(targetImageSlot);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("type", "image");

      const res = await fetch("/api/about/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Image upload failed.");
      }

      const json = await res.json();
      setForm((prev) => {
        const nextImages = [...(prev.overviewImages || [])];
        nextImages[targetImageSlot] = json.fileUrl;
        return { ...prev, overviewImages: nextImages };
      });
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Home Stats list helpers
  const handleHomeStatChange = (index: number, field: keyof HomeStatItem, value: any) => {
    setForm((prev) => {
      const next = [...(prev.homeStats || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, homeStats: next };
    });
  };

  const addHomeStat = () => {
    setForm((prev) => ({
      ...prev,
      homeStats: [...(prev.homeStats || []), { value: 0, label: "NEW METRIC", suffix: "+" }],
    }));
  };

  const removeHomeStat = (index: number) => {
    setForm((prev) => {
      const next = [...(prev.homeStats || [])];
      next.splice(index, 1);
      return { ...prev, homeStats: next };
    });
  };

  // About Page Metrics helpers
  const handleAboutMetricChange = (index: number, field: keyof AboutStatMetric, value: string) => {
    setForm((prev) => {
      const next = [...(prev.aboutStats || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, aboutStats: next };
    });
  };

  const addAboutMetric = () => {
    setForm((prev) => ({
      ...prev,
      aboutStats: [
        ...(prev.aboutStats || []),
        { value: "100", description: "Impact description goes here" },
      ],
    }));
  };

  const removeAboutMetric = (index: number) => {
    setForm((prev) => {
      const next = [...(prev.aboutStats || [])];
      next.splice(index, 1);
      return { ...prev, aboutStats: next };
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "video"
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Film className="h-4 w-4" />
            Home Video
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("homeStats")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "homeStats"
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Hash className="h-4 w-4" />
            Home Stats
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("aboutStats")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "aboutStats"
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Info className="h-4 w-4" />
            About Page Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "overview"
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            About Page Overview
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={videoInputRef}
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={handleVideoUpload}
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleOverviewImageUpload}
      />

      {/* ── TAB 1: HOME VIDEO ──────────────────────────────────────────────── */}
      {activeTab === "video" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-bold text-zinc-900">Homepage About Section Video</h3>
            <p className="mb-6 text-sm text-zinc-500">
              The video is hosted directly on Cloudflare R2 for fast streaming and instant playback.
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 bg-black shadow-inner">
                  {form.videoUrl ? (
                    <video
                      key={form.videoUrl}
                      src={`${form.videoUrl}#t=25`}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500">
                      No video configured
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {isUploadingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                        Uploading to Cloudflare R2...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 text-brand-blue" />
                        Upload New Video (.mp4 / .webm)
                      </>
                    )}
                  </button>
                  <span className="text-xs text-zinc-400">Direct Cloudflare R2 fast upload</span>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-5">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Cloudflare R2 Video URL
                  </label>
                  <input
                    type="url"
                    value={form.videoUrl ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="https://pub-..."
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Byte-range enabled URL for instantaneous video streaming.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Optional Poster Image URL
                  </label>
                  <input
                    type="url"
                    value={form.videoPosterUrl ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, videoPosterUrl: e.target.value || null }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: HOME STATS ──────────────────────────────────────────────── */}
      {activeTab === "homeStats" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Homepage Impact Metrics</h3>
                <p className="text-sm text-zinc-500">
                  Displayed as animated counters in the Homepage About section.
                </p>
              </div>
              <button
                type="button"
                onClick={addHomeStat}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <Plus className="h-4 w-4" />
                Add Metric
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(form.homeStats || []).map((stat, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => removeHomeStat(idx)}
                    className="absolute top-3 right-3 text-zinc-400 transition-colors hover:text-rose-600"
                    title="Remove Metric"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Label
                      </label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => handleHomeStatChange(idx, "label", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                          Target Value
                        </label>
                        <input
                          type="number"
                          value={stat.value}
                          onChange={(e) =>
                            handleHomeStatChange(idx, "value", parseInt(e.target.value) || 0)
                          }
                          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-bold text-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                          Suffix (+, %, etc.)
                        </label>
                        <input
                          type="text"
                          value={stat.suffix}
                          onChange={(e) => handleHomeStatChange(idx, "suffix", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700"
                          placeholder="+"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ABOUT PAGE IMPACT NUMBERS ───────────────────────────────── */}
      {activeTab === "aboutStats" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">About Page "Excellence in Numbers"</h3>
                <p className="text-sm text-zinc-500">
                  Displayed on the /about page with spring counting animations.
                </p>
              </div>
              <button
                type="button"
                onClick={addAboutMetric}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <Plus className="h-4 w-4" />
                Add Metric
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(form.aboutStats || []).map((metric, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => removeAboutMetric(idx)}
                    className="absolute top-3 right-3 text-zinc-400 transition-colors hover:text-rose-600"
                    title="Remove Metric"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Description / Narrative
                      </label>
                      <textarea
                        rows={3}
                        value={metric.description}
                        onChange={(e) => handleAboutMetricChange(idx, "description", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                        Impact Value (Number)
                      </label>
                      <input
                        type="text"
                        value={metric.value}
                        onChange={(e) => handleAboutMetricChange(idx, "value", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-lg font-bold text-brand-blue"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ABOUT PAGE OVERVIEW & SLIDER ────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-bold text-zinc-900">About Page Hero Slider & Narrative</h3>
            <p className="mb-6 text-sm text-zinc-500">
              Manage the 4 images rotating in the About Page overview slider and accompanying descriptions.
            </p>

            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[0, 1, 2, 3].map((slot) => {
                const imgUrl = (form.overviewImages || [])[slot];
                return (
                  <div
                    key={slot}
                    className="group relative flex aspect-[16/9] flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                  >
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={`Overview Slide ${slot + 1}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">Empty Slot {slot + 1}</span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetImageSlot(slot);
                          imageInputRef.current?.click();
                        }}
                        disabled={isUploadingImage === slot}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-md hover:bg-zinc-100"
                      >
                        {isUploadingImage === slot ? "Uploading..." : "Replace"}
                      </button>
                    </div>

                    <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      Slide {slot + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Overview Title
                  </label>
                  <input
                    type="text"
                    value={form.overviewTitle ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, overviewTitle: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Narrative Paragraph 1
                  </label>
                  <textarea
                    rows={4}
                    value={form.overviewDescription1 ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, overviewDescription1: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                    Narrative Paragraph 2
                  </label>
                  <textarea
                    rows={4}
                    value={form.overviewDescription2 ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, overviewDescription2: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                      Class A Badge
                    </label>
                    <input
                      type="text"
                      value={form.classABadge ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, classABadge: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                      Class A Subtitle
                    </label>
                    <input
                      type="text"
                      value={form.classADescription ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, classADescription: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                      Deliveries Count
                    </label>
                    <input
                      type="text"
                      value={form.deliveriesCount ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, deliveriesCount: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                      Years Count
                    </label>
                    <input
                      type="text"
                      value={form.yearsCount ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, yearsCount: e.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
