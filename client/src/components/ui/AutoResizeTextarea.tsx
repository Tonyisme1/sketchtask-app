import React, { useEffect, useRef } from "react";

// ==========================================
// COMPONENT: AutoResizeTextarea
// Tự động mở rộng chiều cao theo nội dung, không làm nhảy layout
// Chuẩn phong cách mực vẽ SketchTask
// ==========================================

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
  onEnterPress?: () => void;
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
    };

    useEffect(() => {
      adjustHeight();
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
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
        className={`w-full bg-[#FCFBF9] text-[#1C1917] placeholder-[#A8A29E] border-[1.5px] border-[#262626] rounded-[5px] px-3 py-2 text-xs sm:text-sm font-sans focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#262626] transition-all resize-none overflow-hidden leading-relaxed ${className}`}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";
