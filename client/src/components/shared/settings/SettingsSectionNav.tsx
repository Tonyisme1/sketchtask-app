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
  | "shortcuts";

export interface SettingsMenuItem {
  key: SettingsSectionKey;
  label: string;
  compactLabel?: string;
  icon: LucideIcon;
  iconTone: string;
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { key: "account", label: "Tài khoản", compactLabel: "Tài khoản", icon: UserCheck, iconTone: "bg-[var(--bg-surface-muted)] text-[var(--text-main)]" },
  { key: "general", label: "Giao diện", compactLabel: "Giao diện", icon: Sliders, iconTone: "bg-[var(--bg-surface-muted)] text-[var(--text-main)]" },
  { key: "notifications", label: "Thông báo", compactLabel: "Thông báo", icon: Bell, iconTone: "bg-[var(--bg-surface-muted)] text-[var(--text-main)]" },
  { key: "data", label: "Dữ liệu", compactLabel: "Dữ liệu", icon: Database, iconTone: "bg-[var(--bg-surface-muted)] text-[var(--text-main)]" },
  { key: "security", label: "Bảo mật", icon: Lock, iconTone: "bg-[var(--bg-surface-muted)] text-[var(--text-main)]" },
  { key: "shortcuts", label: "Phím tắt", compactLabel: "Phím tắt", icon: Keyboard, iconTone: "bg-[var(--bg-surface-muted)] text-[var(--text-main)]" },
];

const SETTINGS_GROUPS: Array<{ label: string; keys: SettingsSectionKey[] }> = [
  { label: "Cá nhân", keys: ["account", "general"] },
  { label: "Ứng dụng", keys: ["notifications", "data", "security"] },
  { label: "Khác", keys: ["shortcuts"] },
];

interface SettingsSectionNavProps {
  variant: "master" | "list";
  grouping?: "grouped" | "flat";
  items?: SettingsMenuItem[];
  subtitles?: Partial<Record<SettingsSectionKey, string>>;
  activeSection?: SettingsSectionKey;
  platform: "desktop" | "tablet" | "mobile";
  onSelect: (section: SettingsSectionKey) => void;
}

export const SettingsSectionNav: React.FC<SettingsSectionNavProps> = ({
  variant,
  grouping = "grouped",
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
                    ? "bg-[var(--bg-surface-muted)] text-[var(--text-main)]"
                    : "bg-[var(--bg-surface-muted)] text-[var(--text-main)]"
                  : isDesktopMaster
                    ? "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-main)]"
                    : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-main)]"
              }`
            : `flex w-full items-center justify-between px-4 text-left text-[var(--text-main)] transition-colors hover:bg-[var(--bg-interactive)] focus-visible:outline-none ${
                platform === "tablet" ? "min-h-[62px] py-3.5" : "min-h-[58px] py-3"
              }`
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isMaster && isActive
                ? isDesktopMaster
                  ? "bg-[var(--bg-interactive)] text-[var(--text-main)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-main)]"
                : isDesktopMaster
                  ? "bg-transparent text-[var(--text-muted)]"
                  : "bg-[var(--bg-surface-muted)] text-[var(--text-main)]"
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
                    isMaster && isActive ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]"
                }`}
              >
                {subtitle}
              </span>
            )}
          </span>
        </span>
        {!isMaster && <ChevronRight size={17} strokeWidth={2.4} className="shrink-0 text-[var(--text-muted)]" />}
      </button>
    );
  };

  if (variant === "master") {
    return (
      <nav aria-label="Nhóm cài đặt" className={`space-y-3 ${platform === "desktop" ? "desktop-settings-navigation" : ""}`}>
        {groupedItems.map((group) => (
          <section key={group.label}>
            <h3 className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
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

  if (grouping === "flat") {
    return (
      <nav aria-label="Cài đặt" className="overflow-hidden rounded-2xl bg-[var(--bg-surface)]">
        {items.map((item) => renderItem(item, false))}
      </nav>
    );
  }

  return (
    <div className="space-y-3">
      {groupedItems.map((group) => (
        <section key={group.label} aria-labelledby={`settings-group-${group.label}`}>
          <h3
            id={`settings-group-${group.label}`}
            className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]"
          >
            {group.label}
          </h3>
          <div className="overflow-hidden rounded-2xl bg-[var(--bg-surface)]">
            {group.items.map((item) => renderItem(item, false))}
          </div>
        </section>
      ))}
    </div>
  );
};
