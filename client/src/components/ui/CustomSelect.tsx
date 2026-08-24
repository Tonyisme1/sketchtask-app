import React, { useState, useRef, useEffect } from "react";
import { DynamicIcon } from "./DynamicIcon";

// ==========================================
// COMPONENT: CustomSelect (Dropdown với DynamicIcon Hiện Đại Sắc Nét)
// ==========================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Chọn mục...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-0 flex items-center justify-between gap-1 px-2.5 py-1 text-xs bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none text-[#1C1917]"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0 flex items-center">
                  <DynamicIcon name={selectedOption.icon} size={13} strokeWidth={2.2} />
                </span>
              )}
              <span className="truncate font-medium text-left text-xs block min-w-0 flex-1">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-[#78716C] truncate text-left text-xs block min-w-0 flex-1">
              {placeholder}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#78716C] ml-1 shrink-0">▾</span>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-full min-w-[170px] max-w-[240px] bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[3px_3px_0px_#262626] z-50 py-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? "bg-[#FEF08A] font-bold text-[#1C1917]"
                    : "text-[#1C1917] hover:bg-[#F3EFE6]"
                }`}
              >
                {option.icon && (
                  <span className="shrink-0 flex items-center">
                    <DynamicIcon name={option.icon} size={13} strokeWidth={2.2} />
                  </span>
                )}
                <span className="truncate flex-1 min-w-0">{option.label}</span>
                {isSelected && <span className="text-[11px] font-bold shrink-0">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
