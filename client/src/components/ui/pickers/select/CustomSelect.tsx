import React, { useState, useRef, useEffect, useMemo } from "react";
import { DynamicIcon } from "../../core/DynamicIcon";
import { matchesQuery } from "../../../../utils/search";
import { Search, ChevronDown, Check } from "lucide-react";

// ==========================================
// COMPONENT: CustomSelect (Dropdown Phân Nhóm Chuyên Nghiệp + Search + Thụt Lề Phân Cấp)
// ==========================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  count?: number;
  group?: string;   // Tiêu đề nhóm phân loại trong dropdown.
  depth?: number;   // Độ sâu phân cấp thụt lề (0, 1, 2)
  badge?: string;   // Huy hiệu phụ (VD: 2 việc con)
  disabled?: boolean;
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

  // Reset ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

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
    return options.filter((opt) => matchesQuery(opt.label, searchQuery) || (opt.group && matchesQuery(opt.group, searchQuery)));
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
              {selectedOption.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#FEF08A] border border-[#262626] rounded text-[#1C1917] shrink-0">
                  {selectedOption.badge}
                </span>
              )}
              {selectedOption.count !== undefined && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#F3EFE6] border border-[#D4CEBF] rounded text-[#78716C] shrink-0">
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
        <ChevronDown
          size={13}
          strokeWidth={2.4}
          className={`text-[#78716C] ml-1 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#1C1917]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Menu (Ôm khít 100% trigger, chống tràn viền tuyệt đối) */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1 w-full bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 py-1 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden"
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
                  placeholder="Lọc nhanh danh sách..."
                  className="w-full pl-6 pr-2 py-1 bg-[#FBF9F4] border border-[#262626] rounded-[3px] text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* Options List với phân nhóm & thụt lề */}
          <div className="max-h-60 overflow-y-auto no-scrollbar py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-2.5 text-center text-xs text-[#78716C]">
                Không có mục phù hợp
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const prevGroup = idx > 0 ? filteredOptions[idx - 1].group : undefined;
                const showGroupHeader = option.group && option.group !== prevGroup;
                const depthPad = option.depth ? `pl-${Math.min(option.depth * 4 + 3, 10)}` : "px-3";

                return (
                  <React.Fragment key={option.value || `opt-${idx}`}>
                    {/* Header Nhóm */}
                    {showGroupHeader && (
                      <div className="px-2.5 py-1 text-[10px] font-bold text-[#57534E] bg-[#FAF8F3] border-y border-[#D4CEBF]/60 uppercase tracking-wider sticky top-0 z-10 flex items-center gap-1 select-none">
                        <span>{option.group}</span>
                      </div>
                    )}

                    {/* Option Item */}
                    <button
                      type="button"
                      disabled={option.disabled}
                      title={option.label}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`group w-full flex items-center gap-2 py-1.5 text-xs text-left transition-colors ${
                        option.depth ? "pl-6 pr-3" : "px-3"
                      } ${
                        isSelected
                          ? "bg-[#FEF08A] font-bold text-[#1C1917]"
                          : option.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "text-[#1C1917] hover:bg-[#F3EFE6]"
                      }`}
                    >
                      {option.icon && (
                        <span className="shrink-0 flex items-center">
                          <DynamicIcon name={option.icon} size={13} strokeWidth={2.2} />
                        </span>
                      )}

                      <div className="overflow-hidden flex-1 min-w-0">
                        <span className="truncate block group-hover:animate-marquee-hover">
                          {option.label}
                        </span>
                      </div>

                      {option.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#FAF8F3] border border-[#262626] rounded text-[#57534E] shrink-0">
                          {option.badge}
                        </span>
                      )}

                      {option.count !== undefined && (
                        <span className="text-[10px] font-mono text-[#78716C] shrink-0">
                          ({option.count})
                        </span>
                      )}

                      {isSelected && (
                        <Check size={13} strokeWidth={2.6} className="text-emerald-900 shrink-0 ml-1" />
                      )}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
