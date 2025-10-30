import { create } from "zustand";
import { ToastStore } from "../shared/interfaces/toast-store";


export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, severity = "info") =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now() + Math.random(), message, severity },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
