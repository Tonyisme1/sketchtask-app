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

const SETTINGS_GROUPS: Array<{ label: string; keys: SettingsSectionKey[] }> = [
  { label: "Cá nhân", keys: ["account", "general"] },
  { label: "Ứng dụng", keys: ["notifications", "data", "security"] },
  { label: "Khác", keys: ["shortcuts", "about"] },
];

interface SettingsSectionNavProps {
  variant: "master" | "list";
  items?: SettingsMenuItem[];
  subtitles?: Partial<Record<SettingsSectionKey, string>>;
  activeSection?: SettingsSectionKey;
  platform: "desktop" | "tablet" | "mobile";
  onSelect: (section: SettingsSectionKey) => void;
}

export const SettingsSectionNav: React.FC<SettingsSectionNavProps> = ({
  variant,
  items = SETTINGS_MENU_ITEMS,
  subtitles = {},
  activeSection,
  platform,
  onSelect,
}) => {
  const groupedItems = SETTINGS_GROUPS.map((group) => ({
    ...group,
    items: group.keys
      .map((key) => items.find((item) => item.key === key))
      .filter((item): item is SettingsMenuItem => Boolean(item)),
  })).filter((group) => group.items.length > 0);

  const renderItem = (item: SettingsMenuItem, isMaster: boolean) => {
    const IconComp = item.icon;
    const isActive = activeSection === item.key;
    const subtitle = subtitles[item.key];

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onSelect(item.key)}
        aria-current={isActive ? "page" : undefined}
        className={
          isMaster
            ? `flex min-h-10 w-full items-center gap-3 rounded-[6px] border-[1.5px] px-3 text-left text-xs font-bold transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                isActive
                  ? "border-[#262626] bg-[#1C1917] text-white shadow-[2px_2px_0px_#262626]"
                  : "border-transparent bg-transparent text-[#57534E] hover:border-[#D4CEBF] hover:bg-white hover:text-[#1C1917]"
              }`
            : `flex w-full items-center justify-between border-b border-[#E7E5E4] px-4 text-left text-[#57534E] transition-colors last:border-b-0 hover:bg-[#FAF8F3] hover:text-[#1C1917] focus-visible:bg-[#FEF08A] focus-visible:outline-none ${
                platform === "tablet" ? "min-h-[62px] py-3.5" : "min-h-[58px] py-3"
              }`
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-[#262626] ${
              isMaster && isActive ? "bg-white text-[#1C1917]" : item.iconTone
            }`}
          >
            <IconComp size={isMaster ? 15 : 17} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className={`block truncate ${isMaster ? "text-xs" : "text-sm"} font-bold`}>
              {isMaster ? item.label : item.compactLabel || item.label}
            </span>
            {subtitle && (
              <span
                className={`mt-0.5 block truncate text-[11px] font-medium ${
                  isMaster && isActive ? "text-white/70" : "text-[#78716C]"
                }`}
              >
                {subtitle}
              </span>
            )}
          </span>
        </span>
        {!isMaster && <ChevronRight size={17} strokeWidth={2.4} className="shrink-0 text-[#A8A29E]" />}
      </button>
    );
  };

  if (variant === "master") {
    return (
      <nav aria-label="Nhóm cài đặt" className="space-y-3">
        {groupedItems.map((group) => (
          <section key={group.label}>
            <h3 className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => renderItem(item, true))}
            </div>
          </section>
        ))}
      </nav>
    );
  }

  return (
    <div className="space-y-3">
      {groupedItems.map((group) => (
        <section key={group.label} aria-labelledby={`settings-group-${group.label}`}>
          <h3
            id={`settings-group-${group.label}`}
            className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C]"
          >
            {group.label}
          </h3>
          <div className="overflow-hidden rounded-[8px] border-[1.5px] border-[#262626] bg-[#FFFDF8] shadow-[2px_2px_0px_#262626]">
            {group.items.map((item) => renderItem(item, false))}
          </div>
        </section>
      ))}
    </div>
  );
};
