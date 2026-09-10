import React from "react";
import {
  Bell,
  ChevronRight,
  Database,
  Info,
  Keyboard,
  Lock,
  Sliders,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

export type SettingsSectionKey =
  | "account"
  | "general"
  | "notifications"
  | "data"
  | "security"
  | "shortcuts"
  | "about";

export interface SettingsMenuItem {
  key: SettingsSectionKey;
  label: string;
  compactLabel?: string;
  icon: LucideIcon;
  iconTone: string;
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { key: "account", label: "Tài khoản & Đồng bộ", compactLabel: "Tài khoản", icon: UserCheck, iconTone: "bg-white text-[#1C1917]" },
  { key: "general", label: "Giao diện & Trải nghiệm", compactLabel: "Giao diện", icon: Sliders, iconTone: "bg-white text-[#1C1917]" },
  { key: "notifications", label: "Thông báo & Âm thanh", compactLabel: "Thông báo", icon: Bell, iconTone: "bg-white text-[#1C1917]" },
  { key: "data", label: "Dữ liệu & Bộ nhớ", compactLabel: "Dữ liệu", icon: Database, iconTone: "bg-white text-[#1C1917]" },
  { key: "security", label: "Bảo mật", icon: Lock, iconTone: "bg-white text-[#1C1917]" },
  { key: "shortcuts", label: "Phím tắt bàn phím", compactLabel: "Phím tắt", icon: Keyboard, iconTone: "bg-white text-[#1C1917]" },
  { key: "about", label: "Trợ giúp & Giới thiệu", compactLabel: "Giới thiệu", icon: Info, iconTone: "bg-white text-[#1C1917]" },
];

interface SettingsSectionNavProps {
  variant: "master" | "list";
  items?: SettingsMenuItem[];
  activeSection?: SettingsSectionKey;
  platform: "desktop" | "tablet" | "mobile";
  onSelect: (section: SettingsSectionKey) => void;
}

export const SettingsSectionNav: React.FC<SettingsSectionNavProps> = ({
  variant,
  items = SETTINGS_MENU_ITEMS,
  activeSection,
  platform,
  onSelect,
}) => {
  if (variant === "master") {
    return (
      <nav aria-label="Nhóm cài đặt" className="space-y-1">
        {items.map((item) => {
          const IconComp = item.icon;
          const isActive = activeSection === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-10 w-full items-center gap-3 rounded-[6px] border-[1.5px] px-3 text-left text-xs font-bold transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                isActive
                  ? "border-[#262626] bg-[#1C1917] text-white shadow-[2px_2px_0px_#262626]"
                  : "border-transparent bg-transparent text-[#57534E] hover:border-[#D4CEBF] hover:bg-white hover:text-[#1C1917]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-[#262626] ${
                  isActive ? "bg-white text-[#1C1917]" : item.iconTone
                }`}
              >
                <IconComp size={15} strokeWidth={2.2} />
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="overflow-hidden rounded-[8px] border-[1.5px] border-[#262626] bg-[#FFFDF8] shadow-[2px_2px_0px_#262626]">
      {items.map((item) => {
        const IconComp = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center justify-between border-b border-[#E7E5E4] px-4 text-left transition-colors last:border-b-0 hover:bg-[#FAF8F3] focus-visible:bg-[#FEF08A] focus-visible:outline-none ${
              platform === "tablet" ? "min-h-[58px] py-3.5" : "min-h-[52px] py-3"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-[#262626] ${item.iconTone}`}>
                <IconComp size={17} strokeWidth={2.2} />
              </span>
              <span className="truncate text-sm font-bold text-[#1C1917]">{item.compactLabel || item.label}</span>
            </span>
            <ChevronRight size={17} strokeWidth={2.4} className="shrink-0 text-[#A8A29E]" />
          </button>
        );
      })}
    </div>
  );
};
