import React, { useState, useRef, useEffect } from "react";
import { Palette, X } from "lucide-react";

// ==========================================
// COMPONENT: CustomColorPicker (Bảng 20 Màu Đa Dạng Pastel Ấm Áp)
// ==========================================

export interface ColorOption {
  name: string;
  hex: string;
}

interface CustomColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  colors?: ColorOption[];
  label?: string;
  align?: "left" | "right";
  className?: string;
}

export const DEFAULT_PALETTE: ColorOption[] = [
  // 🟡 Nhóm Vàng & Cam ấm
  { name: "Vàng nghệ", hex: "#FEF08A" },
  { name: "Vàng chanh", hex: "#FDE047" },
  { name: "Cam đào", hex: "#FED7AA" },
  { name: "Cam mật", hex: "#FB923C" },
  { name: "Hổ phách", hex: "#FBBF24" },

  // 🟢 Nhóm Xanh lá & Thảo mộc
  { name: "Bạc hà", hex: "#BBF7D0" },
  { name: "Lục non", hex: "#86EFAC" },
  { name: "Xanh bơ", hex: "#A7F3D0" },
  { name: "Xanh xô", hex: "#D9F99D" },
  { name: "Ngọc bích", hex: "#6EE7B7" },

  // 🔵 Nhóm Da trời & Biển
  { name: "Da trời", hex: "#BAE6FD" },
  { name: "Xanh biển", hex: "#7DD3FC" },
  { name: "Lam ngọc", hex: "#A5F3FC" },
  { name: "Thanh thiên", hex: "#38BDF8" },
  { name: "Chàm nhạt", hex: "#93C5FD" },

  // 🟣 Nhóm Tím & Hồng
  { name: "Oải hương", hex: "#DDD6FE" },
  { name: "Tím mộng", hex: "#C4B5FD" },
  { name: "Hồng phấn", hex: "#FBCFE8" },
  { name: "San hô hồng", hex: "#FECDD3" },
  { name: "Hoa sen", hex: "#F472B6" },
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-xs font-bold text-[#1C1917] select-none"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-[#262626] shadow-sm shrink-0"
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
          } top-full mt-1.5 w-[260px] max-w-[calc(100vw-28px)] bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
            <span className="font-bold text-xs flex items-center gap-1.5 text-[#1C1917]">
              <Palette size={14} strokeWidth={2.2} />
              <span>BẢNG MÀU ({colors.length} MÀU)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#78716C] hover:text-[#1C1917] font-bold text-xs p-0.5"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Color Grid (5 cột, nếu quá 10 màu thì cuộn gọn gàng max-h-[82px] ẩn thanh cuộn) */}
          <div
            className={`grid grid-cols-5 gap-1.5 p-1 bg-white border border-[#D4CEBF] rounded-[4px] ${
              colors.length > 10
                ? "max-h-[82px] overflow-y-auto no-scrollbar pr-0.5"
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
                  className={`h-8 rounded-[3px] border-[1.5px] border-[#262626] transition-all flex items-center justify-center text-[10px] font-bold ${
                    isSelected
                      ? "shadow-[2px_2px_0px_#262626] -translate-y-[1px] scale-110 z-10 font-bold"
                      : "hover:scale-105 active:translate-y-[0.5px]"
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && "✓"}
                </button>
              );
            })}
          </div>

          {/* Color Name Footer */}
          <div className="pt-1 border-t border-[#D4CEBF] text-center text-[11px] font-mono text-[#78716C] flex items-center justify-center gap-1.5">
            <span>Đang chọn:</span>
            <span
              className="font-bold text-[#1C1917] px-1.5 py-0.2 rounded border border-[#262626]"
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
