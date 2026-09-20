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
  { key: "account", label: "Tài khoản", compactLabel: "Tài khoản", icon: UserCheck, iconTone: "bg-white text-[#1C1917]" },
  { key: "general", label: "Giao diện", compactLabel: "Giao diện", icon: Sliders, iconTone: "bg-white text-[#1C1917]" },
  { key: "notifications", label: "Thông báo", compactLabel: "Thông báo", icon: Bell, iconTone: "bg-white text-[#1C1917]" },
  { key: "data", label: "Dữ liệu", compactLabel: "Dữ liệu", icon: Database, iconTone: "bg-white text-[#1C1917]" },
  { key: "security", label: "Bảo mật", icon: Lock, iconTone: "bg-white text-[#1C1917]" },
  { key: "shortcuts", label: "Phím tắt", compactLabel: "Phím tắt", icon: Keyboard, iconTone: "bg-white text-[#1C1917]" },
  { key: "about", label: "Giới thiệu", compactLabel: "Giới thiệu", icon: Info, iconTone: "bg-white text-[#1C1917]" },
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
    const isDesktopMaster = isMaster && platform === "desktop";

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onSelect(item.key)}
        aria-current={isActive ? "page" : undefined}
        className={
          isMaster
            ? `flex min-h-10 w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? isDesktopMaster
                    ? "bg-[#1C1917] text-white dark:bg-[var(--bg-surface-muted)] dark:text-[var(--text-main)] shadow-xs"
                    : "bg-[#1C1917] text-white dark:bg-white dark:text-[#1C1917] shadow-xs"
                  : isDesktopMaster
                    ? "bg-transparent text-[#57534E] dark:text-[var(--text-main)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1917] dark:hover:text-white"
                    : "bg-transparent text-[#57534E] dark:text-[#A1A1AA] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1917] dark:hover:text-white"
              }`
            : `flex w-full items-center justify-between border-b border-black/5 dark:border-white/5 px-4 text-left text-[#57534E] dark:text-[#A1A1AA] transition-colors last:border-b-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-[#1C1917] dark:hover:text-white focus-visible:outline-none ${
                platform === "tablet" ? "min-h-[62px] py-3.5" : "min-h-[58px] py-3"
              }`
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isMaster && isActive
                ? isDesktopMaster
                  ? "bg-black/20 dark:bg-black/20 text-white dark:text-[var(--text-main)]"
                  : "bg-white/20 dark:bg-black/10 text-white dark:text-[#1C1917]"
                : isDesktopMaster
                  ? "bg-transparent text-[#1C1917] dark:text-[#F2F2F7]"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-[#1C1917] dark:text-[#F2F2F7]"
            }`}
          >
            <IconComp size={isMaster ? 15 : 17} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className={`settings-navigation-label block truncate ${isMaster ? "text-xs" : "text-sm"} font-bold`}>
              {isMaster ? item.label : item.compactLabel || item.label}
            </span>
            {subtitle && (
              <span
                className={`mt-0.5 block truncate text-[11px] font-medium ${
                  isMaster && isActive ? "text-white/70 dark:text-black/70" : "text-[#78716C] dark:text-[#8E8E93]"
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
      <nav aria-label="Nhóm cài đặt" className={`space-y-3 ${platform === "desktop" ? "desktop-settings-navigation" : ""}`}>
        {groupedItems.map((group) => (
          <section key={group.label}>
            <h3 className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C] dark:text-[#8E8E93]">
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
            className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#78716C] dark:text-[#8E8E93]"
          >
            {group.label}
          </h3>
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#1C1C1E] shadow-xs">
            {group.items.map((item) => renderItem(item, false))}
          </div>
        </section>
      ))}
    </div>
  );
};
