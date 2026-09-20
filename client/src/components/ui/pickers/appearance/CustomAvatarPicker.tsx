import React, { useState, useRef, useEffect } from "react";
import { DynamicIcon } from "../../core/DynamicIcon";
import { Sparkles, X, Check, Edit3 } from "lucide-react";

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
  { hex: "#FEF08A", name: "Vàng nghệ" },
  { hex: "#FFFDF8", name: "Trắng giấy" },
  { hex: "#E7E5E4", name: "Xám bút chì" },
  { hex: "#D4CEBF", name: "Nâu đất" },
  { hex: "#262626", name: "Mực đen" },
];

export interface CustomAvatarPickerProps {
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
        className="relative group w-11 h-11 rounded-2xl shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        style={{ backgroundColor: avatarBg || "#BBF7D0" }}
      >
        <DynamicIcon
          name={avatar || "lucide:User"}
          size={22}
          strokeWidth={2.2}
          className="text-[#1C1917]"
        />
        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-[#2C2C2E] rounded-full flex items-center justify-center text-[#1C1917] dark:text-white shadow-xs group-hover:bg-[#FEF08A]">
          <Edit3 size={10} strokeWidth={2.4} />
        </span>
      </button>

      {/* Popover Box (Rộng rãi, hỗ trợ cuộn ẩn thanh cuộn) */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[280px] max-w-[calc(100vw-36px)] bg-white dark:bg-[#1E1E22] rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] dark:text-[#F2F2F7] select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <span className="font-bold text-xs flex items-center gap-1.5 text-[#1C1917] dark:text-[#F2F2F7]">
              <Sparkles size={14} strokeWidth={2.2} className="text-[var(--accent-blue)]" />
              <span>CHỌN AVATAR SKETCH</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#78716C] dark:text-[#8E8E93] hover:text-[#1C1917] dark:hover:text-white font-bold p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.08] cursor-pointer"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* 1. Chọn Biểu Tượng (4 cột x 4 hàng = 16 icon) */}
          <div>
            <span className="text-[10px] font-bold text-[#78716C] dark:text-[#8E8E93] block mb-1">
              1. Biểu tượng:
            </span>
            <div className="grid grid-cols-4 gap-1.5 p-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl max-h-36 overflow-y-auto no-scrollbar">
              {AVATAR_ICONS.map((item) => {
                const isSelected = avatar === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange(item.id, avatarBg)}
                    title={item.label}
                    className={`h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-[#2C2C2E] shadow-sm font-bold ring-2 ring-[var(--accent-blue)] scale-105"
                        : "hover:bg-white/60 dark:hover:bg-[#2C2C2E]/60 active:scale-95"
                    }`}
                  >
                    <DynamicIcon
                      name={item.id}
                      size={18}
                      strokeWidth={2.2}
                      className="text-[#1C1917] dark:text-[#F2F2F7]"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Màu Nền Avatar */}
          <div>
            <span className="text-[10px] font-bold text-[#78716C] dark:text-[#8E8E93] block mb-1">
              2. Màu nền:
            </span>
            <div className="grid grid-cols-5 gap-1.5 p-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl">
              {AVATAR_BG_COLORS.map((color) => {
                const isSelected =
                  avatarBg?.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => onChange(avatar, color.hex)}
                    title={color.name}
                    className={`h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? "shadow-sm scale-110 ring-2 ring-[var(--accent-blue)] font-bold"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} className="text-[#1C1917]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview & Done Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: avatarBg || "#BBF7D0" }}
              >
                <DynamicIcon
                  name={avatar || "lucide:User"}
                  size={15}
                  strokeWidth={2.2}
                  className="text-[#1C1917]"
                />
              </span>
              <span className="text-[10px] text-[#78716C] dark:text-[#8E8E93] font-mono">Xem trước</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 bg-[#1C1917] dark:bg-white hover:bg-[#262626] dark:hover:bg-[#F2F2F7] text-white dark:text-[#1C1917] text-xs font-bold rounded-2xl shadow-xs active:scale-95 cursor-pointer transition-all"
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
