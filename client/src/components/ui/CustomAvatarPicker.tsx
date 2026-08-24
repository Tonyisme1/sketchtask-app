import React, { useState, useRef, useEffect } from "react";
import { DynamicIcon } from "./DynamicIcon";
import { Palette, Sparkles, X, Check } from "lucide-react";

// ==========================================
// COMPONENT: CustomAvatarPicker (Bộ Chọn Avatar Biểu Tượng & Màu Nền)
// ==========================================

export const AVATAR_ICONS = [
  { id: "lucide:User", label: "Cá nhân" },
  { id: "lucide:Smile", label: "Vui vẻ" },
  { id: "lucide:Cat", label: "Mèo con" },
  { id: "lucide:Sparkles", label: "Lấp lánh" },
  { id: "lucide:Crown", label: "Vương miện" },
  { id: "lucide:Coffee", label: "Cà phê" },
  { id: "lucide:Brain", label: "Bộ não" },
  { id: "lucide:Heart", label: "Trái tim" },
  { id: "lucide:Sun", label: "Mặt trời" },
  { id: "lucide:Rocket", label: "Tên lửa" },
  { id: "lucide:Zap", label: "Tia chớp" },
  { id: "lucide:Flame", label: "Ngọn lửa" },
  { id: "lucide:Music", label: "Âm nhạc" },
  { id: "lucide:BookOpen", label: "Sách mở" },
  { id: "lucide:Star", label: "Ngôi sao" },
  { id: "lucide:Palette", label: "Nghệ thuật" },
];

export const AVATAR_BG_COLORS = [
  { hex: "#BBF7D0", name: "Bạc hà" },
  { hex: "#FEF08A", name: "Vàng nghệ" },
  { hex: "#FECDD3", name: "San hô" },
  { hex: "#BAE6FD", name: "Da trời" },
  { hex: "#DDD6FE", name: "Oải hương" },
  { hex: "#FED7AA", name: "Cam đào" },
  { hex: "#D9F99D", name: "Xanh xô" },
  { hex: "#E7E5E4", name: "Cát ngà" },
];

interface CustomAvatarPickerProps {
  avatar: string;
  avatarBg: string;
  onChange: (avatar: string, avatarBg: string) => void;
  className?: string;
}

export const CustomAvatarPicker: React.FC<CustomAvatarPickerProps> = ({
  avatar,
  avatarBg,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      {/* Trigger Avatar Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Bấm để đổi Avatar"
        className="relative group w-10 h-10 rounded-[6px] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] flex items-center justify-center transition-all hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        style={{ backgroundColor: avatarBg || "#BBF7D0" }}
      >
        <DynamicIcon
          name={avatar || "lucide:User"}
          size={20}
          strokeWidth={2.2}
          className="text-[#1C1917]"
        />
        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-[#262626] rounded-full flex items-center justify-center text-[9px] shadow-sm group-hover:bg-[#FEF08A]">
          ✏️
        </span>
      </button>

      {/* Popover Box (Rộng rãi, hỗ trợ cuộn ẩn thanh cuộn) */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[270px] max-w-[calc(100vw-36px)] bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
            <span className="font-bold text-xs flex items-center gap-1 text-[#1C1917]">
              <Sparkles size={13} strokeWidth={2.2} />
              <span>CHỌN AVATAR SKETCH</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#78716C] hover:text-[#1C1917] font-bold p-0.5"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* 1. Chọn Biểu Tượng (4 cột x 4 hàng = 16 icon) */}
          <div>
            <span className="text-[10px] font-bold text-[#78716C] block mb-1">
              1. Biểu tượng:
            </span>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-white border border-[#D4CEBF] rounded-[4px] max-h-36 overflow-y-auto no-scrollbar">
              {AVATAR_ICONS.map((item) => {
                const isSelected = avatar === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange(item.id, avatarBg)}
                    title={item.label}
                    className={`h-9 rounded-[3px] border-[1.5px] border-[#262626] flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#FEF08A] shadow-[1.5px_1.5px_0px_#262626] -translate-y-[0.5px] font-bold ring-1 ring-[#262626]"
                        : "bg-[#FBF9F4] hover:bg-white active:translate-y-[0.5px]"
                    }`}
                  >
                    <DynamicIcon
                      name={item.id}
                      size={18}
                      strokeWidth={2.2}
                      className="text-[#1C1917]"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Màu Nền Avatar (8 màu pastel) */}
          <div>
            <span className="text-[10px] font-bold text-[#78716C] block mb-1">
              2. Màu nền:
            </span>
            <div className="grid grid-cols-8 gap-1 p-1 bg-white border border-[#D4CEBF] rounded-[4px]">
              {AVATAR_BG_COLORS.map((color) => {
                const isSelected =
                  avatarBg?.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => onChange(avatar, color.hex)}
                    title={color.name}
                    className={`h-6 rounded-[2px] border border-[#262626] flex items-center justify-center transition-all ${
                      isSelected
                        ? "shadow-[1.5px_1.5px_0px_#262626] scale-110 ring-1 ring-[#262626] font-bold"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview & Done Button */}
          <div className="pt-2 border-t border-[#D4CEBF] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="w-6 h-6 rounded border border-[#262626] flex items-center justify-center shadow-sm"
                style={{ backgroundColor: avatarBg || "#BBF7D0" }}
              >
                <DynamicIcon
                  name={avatar || "lucide:User"}
                  size={14}
                  strokeWidth={2.2}
                />
              </span>
              <span className="text-[10px] font-mono text-[#78716C]">
                Xem trước
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] rounded text-[11px] font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
            >
              ✓ Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

