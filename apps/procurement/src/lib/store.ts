import { create } from "zustand";
import type { PurchaseRequest } from "@/types/procurement";
import { getClientProcurementProfile, type ProcurementProfile } from "./profile-client";

interface ProcurementState {
  user: ProcurementProfile | null;
  requests: PurchaseRequest[];
  isModalOpen: boolean;
  searchQuery: string;
  statusFilter: string;
  departmentFilter: string;
  viewMode: "table" | "grid";
  isRefreshing: boolean;

  // Actions
  setUser: (user: ProcurementProfile | null) => void;
  setRequests: (requests: PurchaseRequest[]) => void;
  setIsModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setDepartmentFilter: (dept: string) => void;
  setViewMode: (mode: "table" | "grid") => void;
  loadData: () => Promise<void>;
}

export const useProcurementStore = create<ProcurementState>((set, get) => ({
  user: null,
  requests: [],
  isModalOpen: false,
  searchQuery: "",
  statusFilter: "all",
  departmentFilter: "all",
  viewMode: "table",
  isRefreshing: false,

  setUser: (user) => set({ user }),
  setRequests: (requests) => set({ requests }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setDepartmentFilter: (departmentFilter) => set({ departmentFilter }),
  setViewMode: (viewMode) => set({ viewMode }),

  loadData: async () => {
    set({ isRefreshing: true });
    const clientProfile = getClientProcurementProfile();
    if (clientProfile && !get().user) {
      set({ user: clientProfile });
    }

    try {
      const [reqRes, meRes] = await Promise.all([
        fetch("/api/procurement", { cache: "no-store" }),
        fetch("/api/me", { cache: "no-store" }).catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData?.user) set({ user: meData.user });
      }

      if (reqRes.ok) {
        const data = await reqRes.json();
        if (Array.isArray(data)) {
          set({ requests: data });
        }
      }
    } catch (err) {
      console.error("Failed to load procurement data", err);
    } finally {
      set({ isRefreshing: false });
    }
  },
}));
