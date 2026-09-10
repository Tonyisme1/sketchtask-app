import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { TOAST_EVENT, ToastEventDetail, ToastTone } from "../../../utils/toast";

interface ToastItem extends ToastEventDetail {
  id: number;
}

const toneConfig: Record<ToastTone, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 size={16} strokeWidth={2.4} />,
    className: "bg-[#BBF7D0] text-[#065F46]",
  },
  info: {
    icon: <Info size={16} strokeWidth={2.4} />,
    className: "bg-[#BAE6FD] text-[#1C1917]",
  },
  error: {
    icon: <XCircle size={16} strokeWidth={2.4} />,
    className: "bg-[#FECDD3] text-[#9F1239]",
  },
};

export const ToastViewport: React.FC = () => {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      if (!detail?.message) return;

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      setToast({
        id: Date.now(),
        message: detail.message,
        tone: detail.tone || "success",
        durationMs: detail.durationMs,
      });

      timeoutRef.current = window.setTimeout(
        () => setToast(null),
        detail.durationMs || 2600,
      );
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!toast) return null;

  const config = toneConfig[toast.tone || "success"];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-[100] flex justify-center px-4 sm:bottom-6">
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex max-w-[min(92vw,28rem)] items-center gap-2 rounded-[6px] border-[1.5px] border-[#262626] px-3.5 py-2.5 text-xs font-bold shadow-[2px_2px_0px_#262626] animate-in fade-in slide-in-from-bottom-2 duration-150 ${config.className}`}
      >
        {config.icon}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
