"use client";

import {
  Folder,
  FolderPlus,
  Upload,
  Search,
  Grid,
  List as ListIcon,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Download,
  Copy,
  Share2,
  Trash2,
  ExternalLink,
  Edit2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File as GenericFileIcon,
  Check,
  X,
  AlertCircle,
  Clock,
  HardDrive,
  Eye,
  Loader2,
  Home,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { optimizeImageForUpload } from "@/lib/image-optimizer";

export type ManagedFolderDTO = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    subfolders: number;
  };
};

export type ManagedFileDTO = {
  id: string;
  folderId?: string | null;
  name: string;
  originalName: string;
  fileUrl: string;
  storageKey: string;
  fileType: "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "OTHER";
  mimeType: string;
  sizeBytes: number;
  extension: string;
  description?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  folder?: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  } | null;
};

const FOLDER_COLORS: Record<string, { bg: string; text: string; ring: string; lightBg: string }> = {
  blue: { bg: "bg-[#0073bc]", text: "text-[#0073bc]", ring: "ring-blue-200", lightBg: "bg-blue-50" },
  indigo: { bg: "bg-indigo-600", text: "text-indigo-600", ring: "ring-indigo-200", lightBg: "bg-indigo-50" },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-600", ring: "ring-emerald-200", lightBg: "bg-emerald-50" },
  amber: { bg: "bg-amber-600", text: "text-amber-600", ring: "ring-amber-200", lightBg: "bg-amber-50" },
  rose: { bg: "bg-rose-600", text: "text-rose-600", ring: "ring-rose-200", lightBg: "bg-rose-50" },
  purple: { bg: "bg-purple-600", text: "text-purple-600", ring: "ring-purple-200", lightBg: "bg-purple-50" },
};

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function FileManager() {
  const [folders, setFolders] = useState<ManagedFolderDTO[]>([]);
  const [files, setFiles] = useState<ManagedFileDTO[]>([]);
  const [currentFolder, setCurrentFolder] = useState<ManagedFolderDTO | null>(null);
  const [folderHistory, setFolderHistory] = useState<ManagedFolderDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("blue");
  const [folderSaving, setFolderSaving] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  // Upload modal / state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Preview Modal
  const [previewFile, setPreviewFile] = useState<ManagedFileDTO | null>(null);

  // Edit File / Folder Modal
  const [editingItem, setEditingItem] = useState<{
    type: "folder" | "file";
    id: string;
    name: string;
    description?: string;
    color?: string;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "folder" | "file";
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadCurrentFolderData = async (folderId?: string | null) => {
    try {
      setLoading(true);
      const fid = folderId ?? (currentFolder ? currentFolder.id : "root");
      const [foldersRes, filesRes] = await Promise.all([
        fetch(`/api/folders?parentId=${encodeURIComponent(fid)}`),
        fetch(`/api/files?folderId=${encodeURIComponent(fid)}`),
      ]);

      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }
      if (filesRes.ok) {
        const data = await filesRes.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load file explorer data:", err);
      showToast("Error loading file explorer");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCurrentFolderData(currentFolder ? currentFolder.id : null);
  }, [currentFolder]);

  // Navigate into a folder
  const navigateToFolder = (folder: ManagedFolderDTO) => {
    setFolderHistory((prev) => [...prev, folder]);
    setCurrentFolder(folder);
    setSearchQuery("");
  };

  // Navigate to parent or specific breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      // Root
      setFolderHistory([]);
      setCurrentFolder(null);
    } else {
      const target = folderHistory[index];
      setFolderHistory((prev) => prev.slice(0, index + 1));
      setCurrentFolder(target);
    }
    setSearchQuery("");
  };

  // ── Actions: Copy URL & Share ──────────────────────────────────────────────

  const getShareUrl = (file: ManagedFileDTO) => {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" && window.location.origin.includes(":3001")
        ? window.location.origin.replace(":3001", ":3000")
        : "https://rvcc-enquiry.vercel.app");
    return `${siteUrl.replace(/\/$/, "")}/s/${file.id}`;
  };

  const handleCopyUrl = async (file: ManagedFileDTO, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareUrl = getShareUrl(file);
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Rich preview link copied to clipboard!");
    } catch {
      showToast("Could not copy link");
    }
  };

  const handleShare = async (file: ManagedFileDTO, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareUrl = getShareUrl(file);
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: file.description || `File: ${file.name}`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }
    // Fallback to copy
    handleCopyUrl(file);
  };

  // ── Actions: Create Folder ────────────────────────────────────────────────

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setFolderSaving(true);
    setFolderError(null);

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
          parentId: currentFolder?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFolderError(data.error || "Failed to create folder");
        return;
      }

      setFolders((prev) => [...prev, data.folder].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateFolderOpen(false);
      setNewFolderName("");
      showToast(`Folder "${data.folder.name}" created`);
    } catch {
      setFolderError("Network error while creating folder.");
    } finally {
      setFolderSaving(false);
    }
  };

  // ── Actions: Upload Files ─────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      let uploadedCount = 0;
      for (let i = 0; i < selectedFiles.length; i++) {
        let fileToUpload = selectedFiles[i];

        // Optimize raster images (PNG, JPEG, WebP) before uploading to save storage & bandwidth
        if (fileToUpload.type.startsWith("image/") && !fileToUpload.type.includes("svg")) {
          try {
            const { file: optimized } = await optimizeImageForUpload(fileToUpload, {
              maxWidth: 2400,
              maxHeight: 2400,
              quality: 0.95,
            });
            fileToUpload = optimized;
          } catch (optErr) {
            console.warn("[file_manager] Image optimization fallback to original:", optErr);
          }
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);
        if (currentFolder?.id) {
          formData.append("folderId", currentFolder.id);
        }
        formData.append("name", fileToUpload.name);

        const res = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed uploading ${fileToUpload.name}`);
        }

        const data = await res.json();
        if (data.file) {
          setFiles((prev) => [data.file, ...prev]);
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / selectedFiles.length) * 100));
      }

      showToast(`Uploaded ${uploadedCount} file(s) successfully`);
      setUploadModalOpen(false);
      setSelectedFiles([]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // ── Actions: Edit File / Folder ───────────────────────────────────────────

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditSaving(true);
    try {
      if (editingItem.type === "folder") {
        const res = await fetch(`/api/folders/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingItem.name,
            color: editingItem.color,
          }),
        });
        if (!res.ok) throw new Error("Failed to update folder");
        const data = await res.json();
        setFolders((prev) => prev.map((f) => (f.id === data.folder.id ? { ...f, ...data.folder } : f)));
        showToast("Folder updated");
      } else {
        const res = await fetch(`/api/files/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingItem.name,
            description: editingItem.description,
          }),
        });
        if (!res.ok) throw new Error("Failed to update file");
        const data = await res.json();
        setFiles((prev) => prev.map((f) => (f.id === data.file.id ? { ...f, ...data.file } : f)));
        if (previewFile && previewFile.id === data.file.id) {
          setPreviewFile(data.file);
        }
        showToast("File updated");
      }
      setEditingItem(null);
    } catch (err: any) {
      showToast(err.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Actions: Delete ───────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      if (deleteConfirm.type === "folder") {
        const res = await fetch(`/api/folders/${deleteConfirm.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete folder");
        setFolders((prev) => prev.filter((f) => f.id !== deleteConfirm.id));
        showToast(`Folder "${deleteConfirm.name}" deleted`);
      } else {
        const res = await fetch(`/api/files/${deleteConfirm.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete file");
        setFiles((prev) => prev.filter((f) => f.id !== deleteConfirm.id));
        if (previewFile?.id === deleteConfirm.id) setPreviewFile(null);
        showToast(`File "${deleteConfirm.name}" deleted`);
      }
      setDeleteConfirm(null);
    } catch (err: any) {
      showToast(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // Filter files by search and type
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedTypeFilter === "ALL" || f.fileType === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [files, searchQuery, selectedTypeFilter]);

  const filteredFolders = useMemo(() => {
    return folders.filter((f) => {
      return !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [folders, searchQuery]);

  // Render Icon for file
  const getFileIcon = (type: string, ext: string, size = "w-6 h-6") => {
    switch (type) {
      case "IMAGE":
        return <ImageIcon className={`${size} text-blue-500`} />;
      case "VIDEO":
        return <Video className={`${size} text-rose-500`} />;
      case "AUDIO":
        return <Music className={`${size} text-purple-500`} />;
      case "DOCUMENT":
        return <FileText className={`${size} text-amber-500`} />;
      default:
        return <GenericFileIcon className={`${size} text-zinc-400`} />;
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-0 w-full">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Top Header & Action Toolbar - Unified with Services/Projects/Gallery */}
      <div className="sticky top-0 z-20 -mx-5 -mt-6 md:-mx-8 md:-mt-9 mb-8 bg-white/95 px-5 md:px-8 py-3.5 backdrop-blur-md border-b border-zinc-200/80 shadow-2xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/content"
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Back to content"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <HardDrive className="h-5 w-5 text-[#0073bc]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-950">File Manager</h1>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#0073bc] border border-blue-100">
                    Cloudflare R2
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Manage folders, upload media & documents, copy CDN links, and share files
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setRefreshing(true);
                loadCurrentFolderData(currentFolder?.id || null);
              }}
              disabled={refreshing || loading}
              title="Refresh files"
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setCreateFolderOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
            >
              <FolderPlus className="h-4 w-4 text-zinc-500" />
              <span>New Folder</span>
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors shrink-0 cursor-pointer"
            >
              <Upload className="h-4 w-4 stroke-[2.5]" />
              <span>Upload Files</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-zinc-100">
          {/* Breadcrumbs with subtle pills */}
          <nav className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 overflow-x-auto py-1">
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ${!currentFolder ? "bg-blue-50 text-[#0073bc] font-bold" : "hover:bg-zinc-100 hover:text-zinc-900"
                }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Root</span>
            </button>

            {folderHistory.map((f, idx) => {
              const isLast = idx === folderHistory.length - 1;
              return (
                <React.Fragment key={f.id}>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                  <button
                    onClick={() => navigateToBreadcrumb(idx)}
                    className={`truncate max-w-[140px] rounded-lg px-2 py-1 transition-colors ${isLast ? "bg-blue-50 text-[#0073bc] font-bold" : "hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                  >
                    {f.name}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Controls: Search, View Mode, Filter */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Search Input matching Project/Services search */}
            <div className="relative w-full sm:w-60 md:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search files & folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white py-1.5 pl-9 pr-9 text-xs font-medium text-zinc-800 shadow-2xs placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="h-8 rounded-2xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 shadow-2xs focus:border-[#0073bc] focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10"
            >
              <option value="ALL">All Types</option>
              <option value="IMAGE">Images</option>
              <option value="VIDEO">Videos</option>
              <option value="DOCUMENT">Documents</option>
              <option value="AUDIO">Audio</option>
            </select>

            {/* View Mode Toggle matching Gallery tabs */}
            <div className="flex items-center rounded-2xl bg-zinc-100 p-1 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${viewMode === "grid" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                title="Grid View"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${viewMode === "list" ? "bg-white text-zinc-950 shadow-2xs" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                title="List View"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pb-16 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Loading files and folders...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Folders Section */}
            {filteredFolders.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  <span>Folders ({filteredFolders.length})</span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {filteredFolders.map((folder) => {
                    const colorStyle = FOLDER_COLORS[folder.color || "indigo"] || FOLDER_COLORS.indigo;
                    const countFiles = folder._count?.files ?? 0;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => navigateToFolder(folder)}
                        className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer select-none"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorStyle.lightBg} ${colorStyle.text} transition-transform group-hover:scale-105`}
                          >
                            <Folder className="h-5 w-5 fill-current" />
                          </div>

                          {/* 3-dots Menu for folder */}
                          <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem({
                                  type: "folder",
                                  id: folder.id,
                                  name: folder.name,
                                  color: folder.color || "indigo",
                                });
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                              title="Rename / Edit folder"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-zinc-900 group-hover:text-[#0073bc] transition-colors">
                            {folder.name}
                          </span>
                          <span className="block text-[11px] text-zinc-400">
                            {countFiles} {countFiles === 1 ? "file" : "files"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Files Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Files ({filteredFiles.length})</span>
                </h2>
                <span className="text-xs text-zinc-400">
                  Total Size: {formatBytes(filteredFiles.reduce((acc, f) => acc + f.sizeBytes, 0))}
                </span>
              </div>

              {filteredFiles.length === 0 && filteredFolders.length === 0 ? (
                /* Empty state - styled to match RVCC admin aesthetic */
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/40 p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0073bc] mb-4 border border-blue-100 shadow-2xs">
                    <FolderPlus className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">This folder is empty</h3>
                  <p className="mt-1 text-xs text-zinc-500 max-w-sm">
                    Upload images, videos, documents, or create subfolders to organize your digital assets.
                  </p>
                  <div className="mt-6 flex items-center gap-2.5">
                    <button
                      onClick={() => setCreateFolderOpen(true)}
                      className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
                    >
                      <FolderPlus className="h-4 w-4 text-zinc-500" />
                      <span>New Folder</span>
                    </button>
                    <button
                      onClick={() => setUploadModalOpen(true)}
                      className="flex items-center gap-2 rounded-2xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors"
                    >
                      <Upload className="h-4 w-4 stroke-[2.5]" />
                      <span>Upload Files</span>
                    </button>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredFiles.map((file) => {
                    const isImg = file.fileType === "IMAGE";
                    const isVid = file.fileType === "VIDEO";

                    return (
                      <div
                        key={file.id}
                        onClick={() => setPreviewFile(file)}
                        className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-3 shadow-2xs hover:border-[#0073bc]/40 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                      >
                        {/* File Thumbnail / Preview Area */}
                        <div className="relative aspect-16/10 w-full rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center mb-3">
                          {isImg ? (
                            <img
                              src={file.fileUrl}
                              alt={file.name}
                              loading="lazy"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : isVid ? (
                            <div className="relative flex h-full w-full items-center justify-center bg-zinc-900 text-white">
                              <video
                                src={file.fileUrl}
                                className="h-full w-full object-cover opacity-60"
                                preload="metadata"
                              />
                              <Video className="absolute h-8 w-8 text-white/90 drop-shadow" />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-zinc-400">
                              {getFileIcon(file.fileType, file.extension, "w-10 h-10")}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                {file.extension || file.fileType}
                              </span>
                            </div>
                          )}

                          {/* Quick Hover Action Overlays */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-zinc-800 hover:bg-white hover:text-[#0073bc] transition-colors shadow"
                              title="Open / Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleCopyUrl(file, e)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-zinc-800 hover:bg-white hover:text-[#0073bc] transition-colors shadow"
                              title="Copy URL"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleShare(file, e)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-zinc-800 hover:bg-white hover:text-[#0073bc] transition-colors shadow"
                              title="Share"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* File Details */}
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-xs font-semibold text-zinc-900 group-hover:text-[#0073bc] transition-colors" title={file.name}>
                              {file.name}
                            </span>
                            <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500 uppercase">
                              {file.extension || file.fileType}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                            <span>{formatBytes(file.sizeBytes)}</span>
                            <span>{formatDate(file.createdAt)}</span>
                          </div>
                        </div>

                        {/* Bottom Actions Toolbar */}
                        <div
                          className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-zinc-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleCopyUrl(file, e)}
                            className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-[#0073bc] transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy URL</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem({
                                  type: "file",
                                  id: file.id,
                                  name: file.name,
                                  description: file.description || "",
                                });
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                              title="Edit metadata"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({
                                  type: "file",
                                  id: file.id,
                                  name: file.name,
                                });
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Delete file"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="rounded-3xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-500">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Name</th>
                        <th className="py-3 px-4 font-semibold">Type</th>
                        <th className="py-3 px-4 font-semibold">Size</th>
                        <th className="py-3 px-4 font-semibold">Uploaded</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredFiles.map((file) => (
                        <tr
                          key={file.id}
                          onClick={() => setPreviewFile(file)}
                          className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-medium text-zinc-900">
                            <div className="flex items-center gap-2.5">
                              {getFileIcon(file.fileType, file.extension, "w-4 h-4 shrink-0")}
                              <span className="truncate max-w-xs">{file.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-500 uppercase">{file.extension || file.fileType}</td>
                          <td className="py-3 px-4 text-zinc-500">{formatBytes(file.sizeBytes)}</td>
                          <td className="py-3 px-4 text-zinc-500">{formatDate(file.createdAt)}</td>
                          <td
                            className="py-3 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => handleCopyUrl(file, e)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                title="Copy URL"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleShare(file, e)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                title="Share"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem({
                                    type: "file",
                                    id: file.id,
                                    name: file.name,
                                    description: file.description || "",
                                  });
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({
                                    type: "file",
                                    id: file.id,
                                    name: file.name,
                                  });
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Create Folder ─────────────────────────────────────────── */}
      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0073bc]">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-zinc-900">Create New Folder</h3>
              </div>
              <button
                onClick={() => setCreateFolderOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="mt-4 space-y-4">
              {folderError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{folderError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing Materials, Project Audits"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#0073bc] focus:outline-none focus:ring-1 focus:ring-[#0073bc]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {Object.keys(FOLDER_COLORS).map((colorKey) => {
                    const c = FOLDER_COLORS[colorKey];
                    const selected = newFolderColor === colorKey;
                    return (
                      <button
                        type="button"
                        key={colorKey}
                        onClick={() => setNewFolderColor(colorKey)}
                        className={`h-7 w-7 rounded-full ${c.bg} transition-transform flex items-center justify-center ${selected ? "ring-2 ring-offset-2 ring-[#0073bc] scale-110" : "opacity-70 hover:opacity-100"
                          }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setCreateFolderOpen(false)}
                  className="rounded-2xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={folderSaving || !newFolderName.trim()}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] disabled:opacity-50"
                >
                  {folderSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Folder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Upload Files ───────────────────────────────────────────── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0073bc]">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">Upload to Cloudflare R2</h3>
                  <p className="text-[11px] text-zinc-400">
                    Target: {currentFolder ? `Folder / ${currentFolder.name}` : "Root Storage"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Drag and drop area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center hover:border-[#0073bc] hover:bg-blue-50/20 transition-all cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 group-hover:bg-blue-50 group-hover:text-[#0073bc] transition-colors mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-800">
                  Click to select files or drag & drop
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Supports Images, Videos, PDFs, Word, Excel, PowerPoint (up to 100MB each)
                </p>
              </div>

              {/* Selected Files Preview List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 mb-1">
                    <span>Selected Files ({selectedFiles.length})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-rose-500 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  {selectedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-xs border border-zinc-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                        <span className="truncate font-medium text-zinc-800">{f.name}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 shrink-0">{formatBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-[#0073bc] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                  className="rounded-2xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] disabled:opacity-50"
                >
                  {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{uploading ? "Uploading..." : `Upload (${selectedFiles.length})`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Preview File ─────────────────────────────────────────── */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl bg-zinc-950 text-white shadow-2xl overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(previewFile.fileType, previewFile.extension, "w-5 h-5 shrink-0")}
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-sm text-white" title={previewFile.name}>
                    {previewFile.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {formatBytes(previewFile.sizeBytes)} • {previewFile.mimeType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(previewFile)}
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={() => handleShare(previewFile)}
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>

                <a
                  href={previewFile.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Tab</span>
                </a>

                <button
                  onClick={() => setPreviewFile(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Media Body */}
            <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950 overflow-auto min-h-[360px]">
              {previewFile.fileType === "IMAGE" ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.name}
                  className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-lg"
                />
              ) : previewFile.fileType === "VIDEO" ? (
                <video
                  src={previewFile.fileUrl}
                  controls
                  autoPlay
                  className="max-h-[65vh] max-w-full rounded-lg shadow-lg"
                />
              ) : previewFile.fileType === "AUDIO" ? (
                <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-2xl w-full max-w-md">
                  <Music className="h-16 w-16 text-blue-400 mb-4" />
                  <p className="font-medium text-sm mb-4">{previewFile.name}</p>
                  <audio src={previewFile.fileUrl} controls className="w-full" />
                </div>
              ) : previewFile.mimeType.includes("pdf") ? (
                <iframe
                  src={previewFile.fileUrl}
                  title={previewFile.name}
                  className="h-[65vh] w-full rounded-lg bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="h-20 w-20 text-zinc-600 mb-4" />
                  <h4 className="text-base font-semibold text-zinc-200 mb-2">{previewFile.name}</h4>
                  <p className="text-xs text-zinc-500 mb-6 max-w-xs">
                    This file type does not support in-app preview. You can open it in a new tab or download directly.
                  </p>
                  <a
                    href={previewFile.fileUrl}
                    download={previewFile.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-2xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white hover:bg-[#005fa0] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Meta Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/60 text-xs text-zinc-400">
              <span className="truncate max-w-md font-mono text-[11px] text-zinc-500">
                {previewFile.fileUrl}
              </span>
              <span>Uploaded on {formatDate(previewFile.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Metadata (Folder or File) ─────────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900">
                Edit {editingItem.type === "folder" ? "Folder" : "File"}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-none focus:ring-1 focus:ring-[#0073bc]"
                />
              </div>

              {editingItem.type === "folder" ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Folder Color
                  </label>
                  <div className="flex items-center gap-2">
                    {Object.keys(FOLDER_COLORS).map((colorKey) => {
                      const c = FOLDER_COLORS[colorKey];
                      const selected = editingItem.color === colorKey;
                      return (
                        <button
                          type="button"
                          key={colorKey}
                          onClick={() => setEditingItem({ ...editingItem, color: colorKey })}
                          className={`h-7 w-7 rounded-full ${c.bg} transition-transform flex items-center justify-center ${selected ? "ring-2 ring-offset-2 ring-[#0073bc] scale-110" : "opacity-70 hover:opacity-100"
                            }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add brief notes or tags about this asset..."
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-sm text-zinc-900 focus:border-[#0073bc] focus:outline-none focus:ring-1 focus:ring-[#0073bc]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-2xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0]"
                >
                  {editSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Delete ────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-zinc-900">
              Delete {deleteConfirm.type === "folder" ? "Folder" : "File"}?
            </h3>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              Are you sure you want to delete <strong className="text-zinc-800">"{deleteConfirm.name}"</strong>?
              {deleteConfirm.type === "folder" && " All files inside this folder will also be removed."}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-2xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
