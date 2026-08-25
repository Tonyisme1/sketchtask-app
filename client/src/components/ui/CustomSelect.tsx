import React, { useState, useRef, useEffect, useMemo } from "react";
import { DynamicIcon } from "./DynamicIcon";
import { matchesQuery } from "../../utils/search";
import { Search } from "lucide-react";

// ==========================================
// COMPONENT: CustomSelect (Dropdown với Search Chống Quá Tải Hàng Nghìn Mục)
// ==========================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  count?: number;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  enableSearch?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Chọn mục...",
  className = "",
  align = "left",
  enableSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Focus ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      if (options.length > 5) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
    }
  }, [isOpen, options.length]);

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

  // Lọc options theo từ khóa không dấu
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((opt) => matchesQuery(opt.label, searchQuery));
  }, [options, searchQuery]);

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-0 flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none text-[#1C1917]"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0 flex items-center">
                  <DynamicIcon name={selectedOption.icon} size={13} strokeWidth={2.2} />
                </span>
              )}
              <span className="truncate font-bold text-left text-xs block min-w-0 flex-1">
                {selectedOption.label}
              </span>
              {selectedOption.count !== undefined && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#F3EFE6] border border-[#D4CEBF] rounded text-[#78716C]">
                  {selectedOption.count}
                </span>
              )}
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
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1 w-full min-w-[200px] max-w-[320px] bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 py-1 animate-in fade-in zoom-in-95 flex flex-col`}
        >
          {/* Search Box khi có nhiều hơn 5 options */}
          {enableSearch && options.length > 5 && (
            <div className="p-1.5 border-b border-[#D4CEBF]/60">
              <div className="relative flex items-center">
                <Search size={12} className="absolute left-2 text-[#78716C]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lọc nhanh..."
                  className="w-full pl-6 pr-2 py-1 bg-[#FBF9F4] border border-[#262626] rounded-[3px] text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* Options List với thanh cuộn */}
          <div className="max-h-52 overflow-y-auto no-scrollbar py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-2.5 text-center text-xs text-[#78716C]">
                Không có mục phù hợp
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
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
                    {option.count !== undefined && (
                      <span className="text-[10px] font-mono text-[#78716C] shrink-0">
                        ({option.count})
                      </span>
                    )}
                    {isSelected && <span className="text-[11px] font-bold shrink-0 ml-1">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
