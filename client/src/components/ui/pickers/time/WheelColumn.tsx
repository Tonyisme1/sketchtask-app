import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ITEM_HEIGHT, VISIBLE_COUNT } from "./TimePicker.types";

// ==========================================
// SUB-COMPONENT: WheelColumn (Cột Cuộn Bánh Xe Tinh Gọn)
// ==========================================

export interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (val: number) => void;
  label: string;
  accentBg?: string;
  formatItem?: (val: number) => string;
}

export const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  value,
  onChange,
  label,
  accentBg = "bg-[#FAF8F3]",
  formatItem = (v) => String(v).padStart(2, "0"),
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Đảm bảo giá trị luôn nằm trong danh sách items
  const validItems = useMemo(() => {
    if (items.includes(value)) return items;
    return [...items, value].sort((a, b) => a - b);
  }, [items, value]);

  // Cuộn container đến vị trí của giá trị hiện tại
  const scrollToValue = useCallback(
    (val: number, smooth = false) => {
      const idx = validItems.indexOf(val);
      if (idx !== -1 && containerRef.current) {
        const top = idx * ITEM_HEIGHT;
        if (smooth) {
          containerRef.current.scrollTo({ top, behavior: "smooth" });
        } else {
          containerRef.current.scrollTop = top;
        }
      }
    },
    [validItems]
  );

  useEffect(() => {
    if (!isScrollingRef.current) {
      scrollToValue(value, false);
    }
  }, [value, scrollToValue]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Cập nhật ngay khi dòng giữa đã đổi, không bắt người dùng bấm lại vào giá trị.
    const scrollTop = containerRef.current.scrollTop;
    const nearestIndex = Math.max(
      0,
      Math.min(validItems.length - 1, Math.round(scrollTop / ITEM_HEIGHT))
    );
    const selectedValue = validItems[nearestIndex];
    if (selectedValue !== undefined && selectedValue !== value) {
      onChange(selectedValue);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const nearestIndex = Math.max(
        0,
        Math.min(validItems.length - 1, Math.round(scrollTop / ITEM_HEIGHT))
      );
      const selectedValue = validItems[nearestIndex];

      if (selectedValue !== undefined && selectedValue !== value) {
        onChange(selectedValue);
      }

      containerRef.current.scrollTo({
        top: nearestIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });

      isScrollingRef.current = false;
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = validItems.indexOf(value);
    if (currentIndex === -1) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIndex = Math.max(0, currentIndex - 1);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = Math.min(validItems.length - 1, currentIndex + 1);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      const nextIndex = Math.max(0, currentIndex - 5);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      const nextIndex = Math.min(validItems.length - 1, currentIndex + 5);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(validItems[0]);
      scrollToValue(validItems[0], true);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(validItems[validItems.length - 1]);
      scrollToValue(validItems[validItems.length - 1], true);
    }
  };

  const handleItemClick = (val: number) => {
    onChange(val);
    scrollToValue(val, true);
  };

  const stepUp = () => {
    const currentIndex = validItems.indexOf(value);
    if (currentIndex > 0) {
      onChange(validItems[currentIndex - 1]);
      scrollToValue(validItems[currentIndex - 1], true);
    }
  };

  const stepDown = () => {
    const currentIndex = validItems.indexOf(value);
    if (currentIndex < validItems.length - 1) {
      onChange(validItems[currentIndex + 1]);
      scrollToValue(validItems[currentIndex + 1], true);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center select-none">
      <span className="text-[10px] font-bold text-[#78716C] mb-0.5">
        {label}
      </span>

      {/* Nút Nhỏ Tăng */}
      <button
        type="button"
        onClick={stepUp}
        aria-label={`Tăng ${label}`}
        className="w-full py-0.5 mb-0.5 flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F3EF] rounded border border-transparent hover:border-[#D4CEBF] transition-all"
      >
        <ChevronUp size={12} strokeWidth={2.4} />
      </button>

      {/* Khung Cuộn Wheel Drum */}
      <div
        className="relative w-full overflow-hidden rounded-[5px] bg-white border border-[#262626] shadow-inner focus-within:ring-1 focus-within:ring-[#262626] transition-all"
        style={{ height: `${ITEM_HEIGHT * VISIBLE_COUNT}px` }}
        tabIndex={0}
        role="spinbutton"
        aria-label={`Chọn ${label}`}
        aria-valuenow={value}
        aria-valuemin={validItems[0]}
        aria-valuemax={validItems[validItems.length - 1]}
        aria-valuetext={`${formatItem(value)} ${label.toLowerCase()}`}
        onKeyDown={handleKeyDown}
      >
        {/* Lớp Kính Focus Nằm Giữa (Center Lens Highlight) */}
        <div
          className={`absolute left-0 right-0 pointer-events-none ${accentBg} border-y border-[#262626] z-10`}
          style={{
            top: `${ITEM_HEIGHT}px`,
            height: `${ITEM_HEIGHT}px`,
          }}
        />

        {/* Danh Sách Cuộn Dọc */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          role="listbox"
          aria-label={`Danh sách chọn ${label}`}
          className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative"
          style={{
            paddingTop: `${ITEM_HEIGHT}px`,
            paddingBottom: `${ITEM_HEIGHT}px`,
            touchAction: "pan-y",
          }}
        >
          {validItems.map((item) => {
            const isSelected = item === value;
            return (
              <div
                key={item}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleItemClick(item)}
                className={`snap-center flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? "font-mono font-black text-xs sm:text-sm text-[#1C1917] scale-105"
                    : "font-mono font-semibold text-[11px] text-[#A8A29E] hover:text-[#44403C] opacity-70"
                }`}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  zIndex: isSelected ? 3 : 0,
                  position: "relative",
                }}
              >
                {formatItem(item)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút Nhỏ Giảm */}
      <button
        type="button"
        onClick={stepDown}
        aria-label={`Giảm ${label}`}
        className="w-full py-0.5 mt-0.5 flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F3EF] rounded border border-transparent hover:border-[#D4CEBF] transition-all"
      >
        <ChevronDown size={12} strokeWidth={2.4} />
      </button>
    </div>
  );
};
