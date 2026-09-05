"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Upload,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit2,
  ExternalLink,
  Copy,
  Eye,
  Lock,
  Unlock,
  BookOpen,
  ArrowUpDown,
  Download,
  Share2,
  AlertCircle,
  Loader2,
  FileCheck2,
  HardDrive,
  Layers,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useMemo, useRef } from "react";

import { optimizeImageForUpload } from "@/lib/image-optimizer";
import type { CompanyDocumentDTO, DocumentCategory } from "@rvcc/types";

interface DocumentsManagerProps {
  initialDocuments: CompanyDocumentDTO[];
  canDelete: boolean;
}

const CATEGORIES: { label: string; value: DocumentCategory | "ALL" }[] = [
  { label: "All Documents", value: "ALL" },
  { label: "Company Profiles", value: "Profile" },
  { label: "Standards & Compliance", value: "Standard" },
  { label: "Technical Reports", value: "Report" },
  { label: "Product Catalogs", value: "Catalog" },
];

function formatBytes(bytes: number | bigint, decimals = 1) {
  const b = Number(bytes);
  if (!b || b === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function DocumentsManager({ initialDocuments, canDelete }: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<CompanyDocumentDTO[]>(initialDocuments);
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CompanyDocumentDTO | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CompanyDocumentDTO | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<CompanyDocumentDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCategory =
        activeCategory === "ALL" ? true : doc.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.slug.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [documents, activeCategory, searchQuery]);

  // Total stats
  const stats = useMemo(() => {
    const total = documents.length;
    const published = documents.filter((d) => d.isPublished).length;
    const totalBytes = documents.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
    return { total, published, storageStr: formatBytes(totalBytes) };
  }, [documents]);

  const refreshDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // ignore
    }
  };

  // Toggle publish
  const handleTogglePublish = async (doc: CompanyDocumentDTO) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !doc.isPublished }),
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, isPublished: !d.isPublished } : d))
        );
        showToast(`"${doc.title}" ${!doc.isPublished ? "published" : "hidden"}`);
      }
    } catch {
      showToast("Failed to update status");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirmDoc) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteConfirmDoc.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteConfirmDoc.id));
        showToast("Document deleted successfully");
        setDeleteConfirmDoc(null);
      } else {
        showToast("Failed to delete document");
      }
    } catch {
      showToast("Error deleting document");
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy share URL
  const handleCopyShareUrl = async (doc: CompanyDocumentDTO) => {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://rvcc-enquiry.vercel.app";
    const shareUrl = `${siteUrl.replace(/\/$/, "")}/documents/${doc.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Web document link copied to clipboard!");
    } catch {
      showToast("Could not copy link");
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl border border-zinc-800"
          >
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header & Stats Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0073bc]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Company Documents & Publications
              </h1>
              <p className="text-xs font-medium text-zinc-500">
                Manage high-resolution company profiles, standards, brochures, and catalogs displayed on the web app.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="https://rvcc-enquiry.vercel.app/documents"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
            <span>View Live Page</span>
          </Link>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0073bc] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#005f9e] transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-zinc-200 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#0073bc]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Total Publications</p>
            <h4 className="text-2xl font-bold text-zinc-900">{stats.total}</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-zinc-200 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Published & Live</p>
            <h4 className="text-2xl font-bold text-zinc-900">{stats.published}</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-zinc-200 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">Cloudflare R2 Storage</p>
            <h4 className="text-2xl font-bold text-zinc-900">{stats.storageStr}</h4>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 border border-zinc-200/60 max-w-fit">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeCategory === cat.value
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search documents by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#0073bc] focus:ring-1 focus:ring-[#0073bc] transition-all"
          />
        </div>
      </div>

      {/* ── Documents Cards Grid (Matching Web App 3D Book Design) ──────────── */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center">
          <BookOpen className="h-10 w-10 text-zinc-300 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800">No documents found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            {searchQuery || activeCategory !== "ALL"
              ? "Try adjusting your search query or category filter."
              : "Upload your first PDF company profile or document to make it available on the web app."}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#005f9e] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {filteredDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative"
            >
              <div className="relative flex h-full flex-col border border-zinc-200 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-none sm:flex-row">
                {/* ── Left: Enhanced 3D Book Representation (Exact Web App Style) ── */}
                <div className="perspective-1000 relative mx-auto mb-6 aspect-[3/4.5] w-full shrink-0 sm:mx-0 sm:mb-0 sm:w-40 md:w-44">
                  {/* Main Book Body with persistent rotate */}
                  <div className="rotate-y-negative-10 absolute inset-0 z-10 origin-left overflow-hidden border border-zinc-200 bg-white shadow-[10px_10px_30px_rgba(0,0,0,0.15)] transition-transform duration-700 group-hover:rotate-y-0">
                    {/* Cover Image with Inset Effect */}
                    <div className="absolute inset-1 overflow-hidden bg-zinc-900">
                      <Image
                        src={doc.coverImage || "/images/books/company-profile.webp"}
                        alt={doc.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {/* Subtle Cover Texture/Light Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
                    </div>

                    {/* Realistic Rounded Spine */}
                    <div className="absolute top-0 left-0 z-20 h-full w-5 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
                    <div className="absolute top-0 left-0 z-30 h-full w-1 bg-white/10" />

                    {/* Decorative Lines */}
                    <div className="absolute right-6 bottom-6 z-20 h-px w-8 bg-white/40" />
                  </div>

                  {/* Realistic Stacked Pages Effect - Anchored to Spine */}
                  <div className="absolute top-[2px] right-[-4px] bottom-[2px] left-0 -z-10 border border-zinc-200 bg-white shadow-xs" />
                  <div className="absolute top-[4px] right-[-8px] bottom-[4px] left-0 -z-20 border border-zinc-200 bg-white shadow-xs" />
                  <div className="absolute top-[6px] right-[-12px] bottom-[6px] left-0 -z-30 border border-zinc-200 bg-white shadow-sm" />
                </div>

                {/* ── Right: Content Section ── */}
                <div className="flex flex-1 flex-col sm:pl-8">
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[#0073bc] text-[10px] font-bold tracking-widest uppercase">
                      {doc.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePublish(doc)}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${
                          doc.isPublished
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                        }`}
                        title={doc.isPublished ? "Published (Click to hide)" : "Draft (Click to publish)"}
                      >
                        {doc.isPublished ? "Live" : "Draft"}
                      </button>

                      {doc.requiresAuth && (
                        <span
                          className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200"
                          title="Protected with PIN code"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          PIN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Title */}
                  <h3 className="font-heading group-hover:text-[#0073bc] text-2xl leading-[0.9em] text-zinc-900 uppercase transition-colors mb-2">
                    {doc.title}
                  </h3>

                  {/* Slug & File Meta */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-3 font-mono">
                    <span>/{doc.slug}</span>
                    <span>•</span>
                    <span>{doc.fileSize}</span>
                    {doc.pageCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{doc.pageCount} Pages</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="line-clamp-3 text-xs leading-relaxed text-zinc-500 mb-6">
                    {doc.description}
                  </p>

                  {/* Actions Bar */}
                  <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-5">
                    {/* Read & Download Test buttons */}
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-[#0073bc] text-[#0073bc] hover:bg-[#0073bc] hover:text-white px-4 py-1.5 text-[10px] font-black tracking-[0.15em] uppercase transition-all"
                      >
                        Preview PDF
                      </a>
                      <button
                        onClick={() => handleCopyShareUrl(doc)}
                        className="bg-[#0073bc] text-white hover:bg-zinc-900 px-4 py-1.5 text-[10px] font-black tracking-[0.15em] uppercase transition-all"
                      >
                        Share Link
                      </button>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingDoc(doc)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                        title="Edit Document"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => setDeleteConfirmDoc(doc)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Upload Document Modal ─────────────────────────────────────────── */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(newDoc) => {
          setDocuments((prev) => [newDoc, ...prev]);
          setIsUploadModalOpen(false);
          showToast(`"${newDoc.title}" uploaded successfully!`);
        }}
      />

      {/* ── Edit Document Modal ───────────────────────────────────────────── */}
      {editingDoc && (
        <EditDocumentModal
          doc={editingDoc}
          isOpen={true}
          onClose={() => setEditingDoc(null)}
          onSuccess={(updatedDoc) => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
            );
            setEditingDoc(null);
            showToast("Document updated successfully");
          }}
        />
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Delete Publication?</h3>
            <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-zinc-800">"{deleteConfirmDoc.title}"</span>? This will remove it from the web app repository.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmDoc(null)}
                disabled={isDeleting}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-sm"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upload Document Modal Component ──────────────────────────────────────────

function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doc: CompanyDocumentDTO) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("Profile");
  const [description, setDescription] = useState("");
  const [pageCount, setPageCount] = useState<number>(0);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [pinCode, setPinCode] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }

    setPdfFile(file);
    setError(null);

    // Auto-fill title if empty
    if (!title) {
      const base = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      setTitle(base.replace(/\b\w/g, (l) => l.toUpperCase()));
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Optimize cover artwork to crisp high-fidelity WebP
      const optimized = await optimizeImageForUpload(file, {
        maxWidth: 1600,
        maxHeight: 2200,
        quality: 0.96,
      });
      setCoverFile(optimized.file);
      setCoverPreviewUrl(optimized.dataUrl);
    } catch {
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      setError("A PDF document file is required.");
      return;
    }
    if (!title.trim()) {
      setError("Document title is required.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload Cover Image (or use fallback)
      let coverImageUrl = "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/documents/covers/company-profile.webp";
      if (coverFile) {
        setUploadStep("Optimizing & uploading cover image...");
        const coverFormData = new FormData();
        coverFormData.append("file", coverFile);
        coverFormData.append("type", "cover");
        coverFormData.append("title", title);

        const coverRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: coverFormData,
        });
        if (!coverRes.ok) {
          throw new Error("Failed to upload cover image.");
        }
        const coverJson = await coverRes.json();
        coverImageUrl = coverJson.fileUrl;
      }

      // 2. Upload PDF to Cloudflare R2
      setUploadStep("Uploading PDF to Cloudflare R2...");
      const pdfFormData = new FormData();
      pdfFormData.append("file", pdfFile);
      pdfFormData.append("type", "document");
      pdfFormData.append("title", title);

      const pdfRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: pdfFormData,
      });
      if (!pdfRes.ok) {
        throw new Error("Failed to upload PDF document.");
      }
      const pdfJson = await pdfRes.json();

      // 3. Create Record in Database
      setUploadStep("Registering document in database...");
      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug.trim() || undefined,
          category,
          description,
          fileSize: pdfJson.fileSize,
          sizeBytes: pdfJson.sizeBytes,
          pageCount,
          fileUrl: pdfJson.fileUrl,
          storageKey: pdfJson.storageKey,
          coverImage: coverImageUrl,
          requiresAuth,
          pinCode: requiresAuth ? pinCode : undefined,
          isPublished: true,
        }),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json();
        throw new Error(errJson.error || "Failed to create document record.");
      }

      const createJson = await createRes.json();
      onSuccess(createJson.document);
    } catch (err: any) {
      setError(err?.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
      setUploadStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 lg:p-8 shadow-2xl border border-zinc-100 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0073bc]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">Upload New Publication</h3>
              <p className="text-[11px] text-zinc-400">
                Upload PDF to Cloudflare R2 and make it available on the web app.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PDF File Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Select PDF Document *
            </label>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="hidden"
            />
            <div
              onClick={() => pdfInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                pdfFile
                  ? "border-[#0073bc] bg-blue-50/20"
                  : "border-zinc-200 hover:border-[#0073bc] hover:bg-zinc-50"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 mb-2">
                <FileText className="h-5 w-5 text-[#0073bc]" />
              </div>
              {pdfFile ? (
                <div>
                  <p className="text-xs font-bold text-zinc-900">{pdfFile.name}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {formatBytes(pdfFile.size)} • Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-zinc-800">
                    Click to select PDF document
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Supports high-resolution PDF publications up to 250MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Publication Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RVCC Sustainability Standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-[#0073bc] outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-[#0073bc] outline-none bg-white"
              >
                <option value="Profile">Company Profile</option>
                <option value="Standard">Standard & Compliance</option>
                <option value="Report">Technical Report</option>
                <option value="Catalog">Product Catalog</option>
              </select>
            </div>
          </div>

          {/* Custom Slug (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Custom URL Slug (Optional)
              </label>
              <input
                type="text"
                placeholder="auto-generated from title"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-[#0073bc] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Page Count (Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 48"
                value={pageCount || ""}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-[#0073bc] outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide a comprehensive summary of this publication..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-800 focus:border-[#0073bc] outline-none resize-none"
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Custom 3D Book Cover Artwork (Optional)
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              {coverPreviewUrl ? (
                <div className="relative h-16 w-12 rounded-lg border border-zinc-200 overflow-hidden shrink-0">
                  <Image src={coverPreviewUrl} alt="Cover preview" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="relative h-16 w-12 rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-zinc-300" />
                </div>
              )}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  {coverFile ? "Change Cover Image" : "Upload Custom Artwork"}
                </button>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Leave empty to use the standard RVCC embossed company cover. Images are automatically optimized to high-fidelity WebP.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Access Protection */}
          <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-900">Protected Document Access</h4>
                <p className="text-[11px] text-zinc-400">
                  Require visitors to enter a 4-digit PIN to download this document.
                </p>
              </div>
              <input
                type="checkbox"
                checked={requiresAuth}
                onChange={(e) => setRequiresAuth(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-[#0073bc] focus:ring-[#0073bc]"
              />
            </div>

            {requiresAuth && (
              <div className="mt-3 pt-3 border-t border-zinc-200/60 flex items-center gap-3">
                <label className="text-xs font-semibold text-zinc-700">Access PIN Code:</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 2026"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1 text-center font-mono font-bold text-xs"
                />
              </div>
            )}
          </div>

          {/* Progress / Step note */}
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-[#0073bc] font-medium animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{uploadStep || "Processing..."}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-5 py-2 text-xs font-semibold text-white hover:bg-[#005f9e] shadow-sm disabled:opacity-50"
            >
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Publish Publication</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Document Modal Component ────────────────────────────────────────────

function EditDocumentModal({
  doc,
  isOpen,
  onClose,
  onSuccess,
}: {
  doc: CompanyDocumentDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doc: CompanyDocumentDTO) => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [slug, setSlug] = useState(doc.slug);
  const [category, setCategory] = useState<DocumentCategory>(doc.category);
  const [description, setDescription] = useState(doc.description);
  const [pageCount, setPageCount] = useState<number>(doc.pageCount || 0);
  const [isPublished, setIsPublished] = useState(doc.isPublished);
  const [requiresAuth, setRequiresAuth] = useState(doc.requiresAuth);
  const [pinCode, setPinCode] = useState(doc.pinCode || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          category,
          description,
          pageCount,
          isPublished,
          requiresAuth,
          pinCode: requiresAuth ? pinCode : null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update document.");
      }

      const data = await res.json();
      onSuccess(data.document);
    } catch (err: any) {
      setError(err?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 lg:p-8 shadow-2xl border border-zinc-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0073bc]">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">Edit Publication</h3>
              <p className="text-[11px] text-zinc-400">Update metadata and security settings.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-[#0073bc] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 font-mono focus:border-[#0073bc] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-[#0073bc] outline-none bg-white"
              >
                <option value="Profile">Company Profile</option>
                <option value="Standard">Standard & Compliance</option>
                <option value="Report">Technical Report</option>
                <option value="Catalog">Product Catalog</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-800 focus:border-[#0073bc] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Page Count</label>
              <input
                type="number"
                value={pageCount || ""}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 focus:border-[#0073bc] outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#0073bc]"
                />
                <span>Published on Web</span>
              </label>
            </div>
          </div>

          {/* Protection PIN */}
          <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-900">Protected Download</h4>
                <p className="text-[11px] text-zinc-400">Require PIN code for visitors to download.</p>
              </div>
              <input
                type="checkbox"
                checked={requiresAuth}
                onChange={(e) => setRequiresAuth(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-[#0073bc]"
              />
            </div>

            {requiresAuth && (
              <div className="mt-3 pt-3 border-t border-zinc-200/60 flex items-center gap-3">
                <label className="text-xs font-semibold text-zinc-700">Access PIN Code:</label>
                <input
                  type="text"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1 text-center font-mono font-bold text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-5 py-2 text-xs font-semibold text-white hover:bg-[#005f9e]"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
