import React, { useEffect, useRef } from "react";

// ==========================================
// COMPONENT: AutoResizeTextarea
// Tự động mở rộng chiều cao theo nội dung, không làm nhảy layout
// Chuẩn phong cách hiện đại bo góc không viền
// ==========================================

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
  onEnterPress?: () => void;
  ctrlEnterSubmit?: boolean;
}

export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(
  (
    {
      value,
      onChange,
      minRows = 1,
      maxRows = 8,
      onEnterPress,
      ctrlEnterSubmit = false,
      className = "",
      placeholder = "Nhập nội dung...",
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const textareaRef = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = () => {
      const textarea = typeof textareaRef === "function" ? null : textareaRef.current;
      if (!textarea) return;

      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const computed = window.getComputedStyle(textarea);
      const lineHeight = parseInt(computed.lineHeight) || 20;
      const paddingTop = parseInt(computed.paddingTop) || 8;
      const paddingBottom = parseInt(computed.paddingBottom) || 8;

      const minHeight = minRows * lineHeight + paddingTop + paddingBottom;
      const maxHeight = maxRows * lineHeight + paddingTop + paddingBottom;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Nếu vượt quá maxHeight thì cho phép cuộn nội bộ
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (ctrlEnterSubmit && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (onEnterPress) {
          e.preventDefault();
          onEnterPress();
        }
      } else if (!ctrlEnterSubmit && e.key === "Enter" && !e.shiftKey) {
        if (onEnterPress) {
          e.preventDefault();
          onEnterPress();
        }
      }
      props.onKeyDown?.(e);
    };

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          adjustHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={minRows}
        className={`w-full bg-black/[0.04] dark:bg-white/[0.06] text-[#1C1917] dark:text-[#F2F2F7] placeholder-[#78716C] dark:placeholder-[#8E8E93] border-none rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none focus:bg-white dark:focus:bg-[#2C2C2E] shadow-2xs focus:shadow-xs focus:ring-2 focus:ring-[var(--accent-blue)]/30 transition-all resize-none leading-relaxed ${className}`}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";
