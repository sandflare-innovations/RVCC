import { create } from "zustand";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
  link?: string;
}

interface AdminState {
  notifications: AdminNotification[];
  unreadCount: number;
  isNotificationDrawerOpen: boolean;
  activeSearchQuery: string;

  // Actions
  setNotifications: (notifications: AdminNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleNotificationDrawer: () => void;
  setNotificationDrawerOpen: (open: boolean) => void;
  setActiveSearchQuery: (query: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isNotificationDrawerOpen: false,
  activeSearchQuery: "",

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

  toggleNotificationDrawer: () =>
    set((state) => ({ isNotificationDrawerOpen: !state.isNotificationDrawerOpen })),

  setNotificationDrawerOpen: (open) => set({ isNotificationDrawerOpen: open }),
  setActiveSearchQuery: (activeSearchQuery) => set({ activeSearchQuery }),
}));
