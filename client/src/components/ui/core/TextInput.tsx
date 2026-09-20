import React from "react";

// ==========================================
// COMPONENT: TextInput (Modern Rounded Borderless)
// ==========================================

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  error,
  className = "",
  ...props
}) => {
  return (
    <input
      className={`w-full px-4 py-2.5 text-base sm:text-sm text-[#1C1917] dark:text-[#F2F2F7] bg-black/[0.04] dark:bg-white/[0.06] focus:bg-white dark:focus:bg-[#2C2C2E] border-none rounded-2xl outline-none transition-all duration-150 shadow-2xs focus:shadow-xs focus:ring-2 focus:ring-[var(--accent-blue)]/30 ${
        error ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200" : ""
      } placeholder:text-[#78716C] dark:placeholder:text-[#8E8E93] ${className}`}
      {...props}
    />
  );
};
