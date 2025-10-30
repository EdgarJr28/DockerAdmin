export interface Toast {
  id: number;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export interface ToastStore {
  toasts: Toast[];
  showToast: (message: string, severity?: Toast["severity"]) => void;
  removeToast: (id: number) => void;
}
