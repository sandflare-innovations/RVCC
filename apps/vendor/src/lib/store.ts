import { create } from "zustand";

export interface VendorNotification {
  id: string;
  title: string;
  message: string;
  type: "rfq_invited" | "rfq_awarded" | "rfq_closed" | "profile_updated";
  read: boolean;
  createdAt: string;
  link?: string;
}

interface VendorState {
  unreadCount: number;
  notifications: VendorNotification[];
  isDrawerOpen: boolean;

  // Actions
  setNotifications: (notifications: VendorNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleDrawer: () => void;
}

export const useVendorStore = create<VendorState>((set) => ({
  unreadCount: 0,
  notifications: [],
  isDrawerOpen: false,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
}));
