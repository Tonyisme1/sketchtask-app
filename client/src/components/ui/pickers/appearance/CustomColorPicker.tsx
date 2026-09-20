import React, { useState, useRef, useEffect } from "react";
import { Palette, X, Check } from "lucide-react";

// ==========================================
// COMPONENT: CustomColorPicker (Bảng 20 Màu Đa Dạng Pastel Ấm Áp)
// ==========================================

export interface ColorOption {
  name: string;
  hex: string;
}

export interface CustomColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  colors?: ColorOption[];
  label?: string;
  align?: "left" | "right";
  className?: string;
}

export const DEFAULT_PALETTE: ColorOption[] = [
  // ⚪ Nhóm Trắng & Giấy
  { name: "Trắng tinh", hex: "#FFFFFF" },
  { name: "Giấy ngà", hex: "#FAF8F3" },
  { name: "Giấy phác thảo", hex: "#F5F5F4" },
  { name: "Giấy xi măng", hex: "#E7E5E4" },

  // ⚫ Nhóm Đen & Mực
  { name: "Mực đen", hex: "#1C1917" },
  { name: "Đen viền", hex: "#262626" },
  { name: "Xám than", hex: "#57534E" },
  { name: "Xám chì", hex: "#78716C" },

  // 🔴 Nhóm Đỏ
  { name: "Đỏ pastel", hex: "#FEE2E2" },
  { name: "Đỏ san hô", hex: "#FECDD3" },
  { name: "Đỏ tươi", hex: "#EF4444" },
  { name: "Đỏ thẫm", hex: "#DC2626" },

  // 🟢 Nhóm Xanh lá cây
  { name: "Bạc hà nhạt", hex: "#DCFCE7" },
  { name: "Lục non", hex: "#BBF7D0" },
  { name: "Xanh ngọc", hex: "#10B981" },
  { name: "Xanh lá thẫm", hex: "#166534" },

  // 🔵 Nhóm Xanh dương nhạt
  { name: "Lam ngọc nhạt", hex: "#E0F2FE" },
  { name: "Da trời nhạt", hex: "#BAE6FD" },
  { name: "Thanh thiên", hex: "#38BDF8" },
  { name: "Xanh biển", hex: "#0284C7" },
];

export const CustomColorPicker: React.FC<CustomColorPickerProps> = ({
  value,
  onChange,
  colors = DEFAULT_PALETTE,
  label = "Màu bìa",
  align = "left",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedColorObj = colors.find(
    (c) => c.hex.toLowerCase() === value.toLowerCase(),
  );

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
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-xs hover:bg-black/[0.03] dark:hover:bg-white/[0.06] active:scale-95 transition-all text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA] select-none cursor-pointer"
      >
        <span
          className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
          style={{ backgroundColor: value }}
        />
        <span>{selectedColorObj?.name || label}</span>
        <span className="text-[10px] text-[#78716C]">▾</span>
      </button>

      {/* Popover Box (Rộng rãi 260px, 5 cột đều đặn) */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-2 w-[270px] max-w-[calc(100vw-28px)] bg-white dark:bg-[#1E1E22] rounded-3xl shadow-2xl z-50 p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] dark:text-[#FAFAFA] select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <span className="font-bold text-xs flex items-center gap-1.5 text-[#1C1917] dark:text-[#FAFAFA]">
              <Palette size={14} strokeWidth={2.2} className="text-[var(--accent-blue)]" />
              <span>BẢNG MÀU ({colors.length} MÀU)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#78716C] hover:text-[#1C1917] dark:hover:text-white font-bold p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.08] cursor-pointer"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Color Grid (5 cột, nếu quá 10 màu thì cuộn gọn gàng max-h-[82px] ẩn thanh cuộn) */}
          <div
            className={`grid grid-cols-5 gap-1.5 p-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl ${
              colors.length > 10
                ? "max-h-[96px] overflow-y-auto no-scrollbar pr-0.5"
                : ""
            }`}
          >
            {colors.map((color) => {
              const isSelected =
                value.toLowerCase() === color.hex.toLowerCase();
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => {
                    onChange(color.hex);
                    setIsOpen(false);
                  }}
                  title={color.name}
                  className={`h-8 rounded-xl transition-all flex items-center justify-center text-[10px] font-bold active:scale-95 cursor-pointer shadow-2xs ${
                    isSelected
                      ? "shadow-sm scale-105 z-10 font-bold ring-2 ring-[var(--accent-blue)]"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && <Check size={12} strokeWidth={3} className="text-[#1C1917]" />}
                </button>
              );
            })}
          </div>

          {/* Color Name Footer */}
          <div className="pt-1 text-center text-[11px] font-mono text-[#78716C] dark:text-[#A1A1AA] flex items-center justify-center gap-1.5">
            <span>Đang chọn:</span>
            <span
              className="font-bold text-[#1C1917] px-2 py-0.5 rounded-full shadow-2xs"
              style={{ backgroundColor: value }}
            >
              {selectedColorObj?.name || value}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
