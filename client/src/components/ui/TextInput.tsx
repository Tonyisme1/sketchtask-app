import React from "react";

// ==========================================
// COMPONENT: TextInput (Tier 1 Core UI)
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
      className={`w-full px-3 py-2 text-sm text-[#1C1917] bg-white border-[1.5px] rounded-[4px] outline-none transition-all duration-100 ${
        error ? "border-[#FECDD3] bg-rose-50" : "border-[#262626]"
      } focus:shadow-[2px_2px_0px_#262626] focus:-translate-y-[1px] placeholder:text-[#78716C] ${className}`}
      {...props}
    />
  );
};

