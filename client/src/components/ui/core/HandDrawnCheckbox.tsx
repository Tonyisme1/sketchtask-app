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
        className={`${dimensionClass} border-[1.5px] rounded-full flex items-center justify-center transition-all duration-150 shrink-0 ${
          checked
            ? "bg-[#1C1917] border-[#1C1917] text-white shadow-none scale-100"
            : "bg-white border-[#262626] shadow-[1px_1px_0px_#262626] group-hover:border-[#1C1917] group-hover:scale-105"
        }`}
      >
        {checked && (
          <svg
            className={`${iconDimension} text-white`}
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
          className={`text-sm font-medium text-[#1C1917] transition-all duration-150 ${
            checked ? "line-through text-[#78716C] opacity-60" : ""
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
};
