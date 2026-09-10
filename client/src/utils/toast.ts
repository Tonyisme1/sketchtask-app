export const TOAST_EVENT = "sketchtask:toast";

export type ToastTone = "success" | "info" | "error";

export interface ToastEventDetail {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

export const dispatchToast = (detail: ToastEventDetail) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT, {
      detail,
    }),
  );
};
