import React from "react";

// ==========================================
// COMPONENT: Modern Circular Hand-Drawn Checkbox (Tier 1 Core UI)
// ==========================================

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export const HandDrawnCheckbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  size = "md",
}) => {
  const dimensionClass =
    size === "sm"
      ? "w-4 h-4"
      : size === "lg"
      ? "w-6 h-6"
      : "w-5 h-5";

  const iconDimension =
    size === "sm" ? "w-2.5 h-2.5" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
      <div
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        data-checked={checked}
        className={`${dimensionClass} rounded-full border-none flex items-center justify-center transition-all duration-150 shrink-0 ${
          checked
            ? "context-checkbox bg-[#1C1917] text-white dark:bg-[#E4E4E7] dark:text-[#18181B] shadow-2xs scale-100"
            : "bg-black/[0.08] dark:bg-white/[0.12] group-hover:bg-black/[0.15] dark:group-hover:bg-white/[0.2] shadow-2xs group-hover:scale-105"
        }`}
      >
        {checked && (
          <svg
            className={`${iconDimension} text-white dark:text-[#18181B]`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
          </svg>
        )}
      </div>

      {label && (
        <span
          className={`text-sm font-medium text-[#1C1917] dark:text-[#F2F2F7] transition-all duration-150 ${
            checked ? "line-through text-[#78716C] dark:text-[#8E8E93] opacity-60" : ""
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
};
