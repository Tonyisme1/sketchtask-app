import React from "react";

// ==========================================
// COMPONENT: Hand-Drawn Checkbox (Tier 1 Core UI)
// ==========================================

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const HandDrawnCheckbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
}) => {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 border-[1.5px] border-[#262626] rounded-[3px] flex items-center justify-center transition-all duration-100 ${
          checked
            ? "bg-[#BBF7D0] shadow-none translate-x-[1px] translate-y-[1px]"
            : "bg-white shadow-[1.5px_1.5px_0px_#262626] group-hover:-translate-x-[0.5px] group-hover:-translate-y-[0.5px]"
        }`}
      >
        {checked && (
          <svg
            className="w-3.5 h-3.5 text-[#1C1917]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
          </svg>
        )}
      </div>

      {label && (
        <span
          className={`text-sm text-[#1C1917] transition-all duration-150 ${
            checked ? "line-through text-[#78716C]" : ""
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
};

