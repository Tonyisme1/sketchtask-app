import React, { useState, useRef, useEffect } from "react";
import * as Icons from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

// ==========================================
// COMPONENT: CustomEmojiPicker / IconPicker (Hệ Thống Icon Hiện Đại Chuẩn SVG)
// ==========================================

export interface IconCategory {
  id: string;
  label: string;
  categoryIcon: Icons.LucideIcon;
  items: { key: string; name: string }[];
}

export const MODERN_ICON_CATEGORIES: IconCategory[] = [
  {
    id: "work",
    label: "Công việc",
    categoryIcon: Icons.Briefcase,
    items: [
      { key: "lucide:BookMarked", name: "Sổ tay" },
      { key: "lucide:Briefcase", name: "Công việc" },
      { key: "lucide:Laptop", name: "Máy tính" },
      { key: "lucide:Rocket", name: "Dự án" },
      { key: "lucide:Folder", name: "Thư mục" },
      { key: "lucide:Code", name: "Lập trình" },
      { key: "lucide:Target", name: "Mục tiêu" },
      { key: "lucide:Layers", name: "Cấu trúc" },
      { key: "lucide:Compass", name: "Định hướng" },
      { key: "lucide:Shield", name: "Bảo mật" },
      { key: "lucide:Globe", name: "Toàn cầu" },
      { key: "lucide:CheckCircle", name: "Hoàn thành" },
      { key: "lucide:FileText", name: "Tài liệu" },
      { key: "lucide:Wrench", name: "Công cụ" },
      { key: "lucide:Clock", name: "Thời gian" },
      { key: "lucide:Cpu", name: "Công nghệ" },
    ],
  },
  {
    id: "study",
    label: "Học tập",
    categoryIcon: Icons.GraduationCap,
    items: [
      { key: "lucide:GraduationCap", name: "Học tập" },
      { key: "lucide:BookOpen", name: "Đọc sách" },
      { key: "lucide:Palette", name: "Thiết kế" },
      { key: "lucide:Pencil", name: "Ghi chép" },
      { key: "lucide:PenTool", name: "Sáng tạo" },
      { key: "lucide:Sparkles", name: "Ý tưởng" },
      { key: "lucide:Brain", name: "Tư duy" },
      { key: "lucide:Library", name: "Thư viện" },
      { key: "lucide:Music", name: "Âm nhạc" },
      { key: "lucide:Camera", name: "Hình ảnh" },
      { key: "lucide:Feather", name: "Văn chương" },
      { key: "lucide:Bookmark", name: "Đánh dấu" },
      { key: "lucide:Glasses", name: "Nghiên cứu" },
      { key: "lucide:Headphones", name: "Podcast" },
      { key: "lucide:Film", name: "Phim ảnh" },
      { key: "lucide:Lightbulb", name: "Sáng kiến" },
    ],
  },
  {
    id: "life",
    label: "Đời sống",
    categoryIcon: Icons.Heart,
    items: [
      { key: "lucide:Heart", name: "Sức khỏe" },
      { key: "lucide:Coffee", name: "Cà phê" },
      { key: "lucide:Dumbbell", name: "Thể thao" },
      { key: "lucide:Activity", name: "Vận động" },
      { key: "lucide:Smile", name: "Niềm vui" },
      { key: "lucide:Sun", name: "Buổi sáng" },
      { key: "lucide:Moon", name: "Buổi tối" },
      { key: "lucide:Flame", name: "Nhiệt huyết" },
      { key: "lucide:Leaf", name: "Môi trường" },
      { key: "lucide:Zap", name: "Năng lượng" },
      { key: "lucide:Home", name: "Gia đình" },
      { key: "lucide:Apple", name: "Dinh dưỡng" },
      { key: "lucide:Bike", name: "Đạp xe" },
      { key: "lucide:Trees", name: "Thiên nhiên" },
      { key: "lucide:Utensils", name: "Ẩm thực" },
      { key: "lucide:Sparkle", name: "Thư giãn" },
    ],
  },
  {
    id: "goals",
    label: "Mục tiêu",
    categoryIcon: Icons.Trophy,
    items: [
      { key: "lucide:Trophy", name: "Thành tựu" },
      { key: "lucide:Award", name: "Giải thưởng" },
      { key: "lucide:Star", name: "Ngôi sao" },
      { key: "lucide:Crown", name: "Đỉnh cao" },
      { key: "lucide:TrendingUp", name: "Tăng trưởng" },
      { key: "lucide:DollarSign", name: "Tài chính" },
      { key: "lucide:CreditCard", name: "Ngân sách" },
      { key: "lucide:ShoppingBag", name: "Mua sắm" },
      { key: "lucide:Gift", name: "Quà tặng" },
      { key: "lucide:Flag", name: "Cột mốc" },
      { key: "lucide:Key", name: "Chìa khóa" },
      { key: "lucide:Lock", name: "Riêng tư" },
      { key: "lucide:Tag", name: "Nhãn" },
      { key: "lucide:Percent", name: "Đầu tư" },
      { key: "lucide:Medal", name: "Huy chương" },
      { key: "lucide:PieChart", name: "Thống kê" },
    ],
  },
];

interface CustomEmojiPickerProps {
  value: string;
  onChange: (iconKey: string) => void;
  align?: "left" | "right";
  className?: string;
}

export const CustomEmojiPicker: React.FC<CustomEmojiPickerProps> = ({
  value,
  onChange,
  align = "left",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState("work");
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

  const activeTab =
    MODERN_ICON_CATEGORIES.find((t) => t.id === activeTabId) ||
    MODERN_ICON_CATEGORIES[0];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Nút Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-xs font-bold text-[#1C1917] select-none"
      >
        <div className="w-5 h-5 flex items-center justify-center">
          <DynamicIcon name={value || "lucide:BookMarked"} size={16} strokeWidth={2.2} />
        </div>
        <span>Biểu tượng</span>
        <span className="text-[10px] text-[#78716C]">▾</span>
      </button>

      {/* Popover Box - Kích Thước Rộng Chuẩn 280px */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-1.5 w-[280px] max-w-[calc(100vw-28px)] bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded bg-[#FEF08A] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
                <DynamicIcon name={value || "lucide:BookMarked"} size={15} strokeWidth={2.2} />
              </span>
              <span className="font-bold text-xs text-[#1C1917]">
                CHỌN BIỂU TƯỢNG SỔ
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#78716C] hover:text-[#1C1917] font-bold text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Dải 4 Tab Danh Mục với SVG Icon */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-white border border-[#262626] rounded-[4px]">
            {MODERN_ICON_CATEGORIES.map((tab) => {
              const TabIcon = tab.categoryIcon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  title={tab.label}
                  className={`py-1 rounded-[2px] text-xs font-bold flex items-center justify-center transition-all ${
                    activeTabId === tab.id
                      ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                      : "text-[#78716C] hover:bg-[#F3EFE6]"
                  }`}
                >
                  <TabIcon size={14} strokeWidth={2.2} />
                </button>
              );
            })}
          </div>

          {/* Lưới Icon SVG Hiện Đại (4 Cột Rộng Rãi, Nét Mực Sắc Nét) */}
          <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-white border border-[#D4CEBF] rounded-[4px] max-h-48 overflow-y-auto no-scrollbar">
            {activeTab.items.map((item) => {
              const isSelected = value === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onChange(item.key);
                    setIsOpen(false);
                  }}
                  title={item.name}
                  className={`h-11 rounded-[4px] border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#FEF08A] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] font-bold scale-105 z-10"
                      : "border-transparent hover:border-[#262626] hover:bg-[#F3EFE6] text-[#1C1917]"
                  }`}
                >
                  <DynamicIcon name={item.key} size={18} strokeWidth={2.2} />
                  <span className="text-[9px] text-[#78716C] mt-0.5 truncate max-w-[50px] text-center">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
