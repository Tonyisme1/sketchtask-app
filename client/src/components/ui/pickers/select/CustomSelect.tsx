import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { DynamicIcon } from "../../core/DynamicIcon";
import { matchesQuery } from "../../../../utils/search";
import { ChevronDown, Check } from "lucide-react";

// ==========================================
// COMPONENT: CustomSelect (Popup Dropdown Tinh Gọn Nằm Ngay Vị Trí Trigger)
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
}

const VIEWPORT_GUTTER = 8;

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Chọn mục...",
  className = "",
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const minWidth = 200;
    const computedWidth = Math.max(rect.width, minWidth);
    const width = Math.min(computedWidth, window.innerWidth - VIEWPORT_GUTTER * 2);

    let left = align === "right" ? rect.right - width : rect.left;
    if (left + width > window.innerWidth - VIEWPORT_GUTTER) {
      left = window.innerWidth - width - VIEWPORT_GUTTER;
    }
    if (left < VIEWPORT_GUTTER) {
      left = VIEWPORT_GUTTER;
    }

    const estimatedHeight = 240;
    const fitsBelow = window.innerHeight - rect.bottom >= estimatedHeight + VIEWPORT_GUTTER;
    const top = fitsBelow
      ? rect.bottom + 4
      : Math.max(VIEWPORT_GUTTER, rect.top - estimatedHeight - 4);

    setPanelPos({ top, left, width });
  };

  // Reset ô tìm kiếm và tính vị trí khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      updatePosition();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Bám sát vị trí khi scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Lọc options theo từ khóa không dấu
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((opt) => matchesQuery(opt.label, searchQuery) || (opt.group && matchesQuery(opt.group, searchQuery)));
  }, [options, searchQuery]);

  const popoverPanel = isOpen && panelPos ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Danh sách lựa chọn"
      className="fixed z-[1000002] bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] py-1 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden text-[#1C1917]"
      style={{
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
        maxHeight: 260,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Options List với phân nhóm & thụt lề */}
      <div className="max-h-56 overflow-y-auto no-scrollbar py-0.5">
        {filteredOptions.length === 0 ? (
          <div className="p-2.5 text-center text-xs text-[#78716C] font-mono">
            Không có mục phù hợp
          </div>
        ) : (
          filteredOptions.map((option, idx) => {
            const isSelected = option.value === value;
            const prevGroup = idx > 0 ? filteredOptions[idx - 1].group : undefined;
            const showGroupHeader = option.group && option.group !== prevGroup;

            return (
              <React.Fragment key={option.value || `opt-${idx}`}>
                {/* Header Nhóm */}
                {showGroupHeader && (
                  <div className="px-2.5 py-1 text-[11px] font-medium text-[#57534E] bg-[#FAF8F3] border-y border-[#262626]/15 sticky top-0 z-10 flex items-center gap-1 select-none">
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
                  className={`group w-full flex items-center gap-2 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                    option.depth ? "pl-6 pr-3" : "px-3"
                  } ${
                    isSelected
                      ? "bg-[#FEF08A] font-black text-[#1C1917]"
                      : option.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "text-[#1C1917] hover:bg-white"
                  }`}
                >
                  {option.icon && (
                    <span className="shrink-0 flex items-center">
                      <DynamicIcon name={option.icon} size={13} strokeWidth={2.2} />
                    </span>
                  )}

                  <div className="overflow-hidden flex-1 min-w-0">
                    <span className="truncate block font-medium">
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
                    <Check size={13} strokeWidth={2.6} className="text-[#1C1917] shrink-0 ml-1" />
                  )}
                </button>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-0 flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none text-[#1C1917] cursor-pointer"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0 flex items-center">
                  <DynamicIcon name={selectedOption.icon} size={13} strokeWidth={2.2} />
                </span>
              )}
              <span className="truncate font-bold text-left block min-w-0 flex-1">
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
            <span className="text-[#78716C] truncate text-left block min-w-0 flex-1">
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

      {/* Portal Popover Dropdown */}
      {popoverPanel && createPortal(popoverPanel, document.body)}
    </div>
  );
};
