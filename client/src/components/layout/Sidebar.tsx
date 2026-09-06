import React, { useState } from "react";
import { TabKey, TabConfig } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { BrandLogo } from "../ui";
import { CURRENT_APP_VERSION } from "../../services/updateService";
import { getLocalTodayStr } from "../../utils/date";
import { loadNotesFromStorage } from "../../utils/noteStorage";
import {
  getTaskEffectiveDate,
  getTaskTemporalState,
  normalizeTaskTimeType,
  isTaskDueToday,
} from "../../utils/taskSemantics";
import {
  NotebookPen,
  BookMarked,
  Settings,
  LucideIcon,
  ChevronDown,
  Sun,
  Calendar as CalendarIcon,
  Hourglass,
  FileText,
  BookOpen,
  PanelLeftClose,
  UserCheck,
} from "lucide-react";

// ==========================================
// COMPONENT: Desktop Sidebar (Khung Điều Hướng 3 Khu Vực Chính + Nhóm Khác)
// ==========================================

export interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onOpenIntro?: () => void;
  onOpenSettings?: () => void;
}

export interface NavTabItem extends Omit<TabConfig, "icon"> {
  shortLabel: string;
  icon: LucideIcon;
}

// 4 Khu vực chính cấp cao mới
export const PRIMARY_TABS: NavTabItem[] = [
  {
    key: "today",
    label: "Hôm nay",
    shortLabel: "Hôm nay",
    icon: Sun,
    accentColor: "#FEF08A",
  },
  {
    key: "planner",
    label: "Kế hoạch",
    shortLabel: "Kế hoạch",
    icon: CalendarIcon,
    accentColor: "#BAE6FD",
  },
  {
    key: "notes",
    label: "Ghi chép",
    shortLabel: "Ghi chép",
    icon: NotebookPen,
    accentColor: "#BBF7D0",
  },
  {
    key: "review",
    label: "Cá nhân",
    shortLabel: "Cá nhân",
    icon: UserCheck,
    accentColor: "#DDD6FE",
  },
];

// Nhóm "Khác" (Màn hình hiện có & Cài đặt)
export const SECONDARY_TABS: NavTabItem[] = [
  {
    key: "notebooks",
    label: "Sổ tay",
    shortLabel: "Sổ tay",
    icon: BookMarked,
    accentColor: "#DDD6FE", // Lavender
  },
  {
    key: "settings",
    label: "Cài đặt",
    shortLabel: "Cài đặt",
    icon: Settings,
    accentColor: "#FEF08A", // Yellow
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenIntro,
  onOpenSettings,
}) => {
  const {
    tasks,
    notebooks,
    journalEntries,
    habits,
    activeTaskSubTab,
    setActiveTaskSubTab,
    activeNoteSubTab,
    setActiveNoteSubTab,
    isSidebarOpen,
    toggleSidebar,
  } = useAppStore();

  const [isTaskExpanded, setIsTaskExpanded] = useState(true);
  const [isNoteExpanded, setIsNoteExpanded] = useState(true);

  const todayStr = getLocalTodayStr(new Date());

  // Đếm số việc cần làm hôm nay cho badge
  const pendingTodayCount = tasks.filter((t) => {
    if (t.completed) return false;
    return isTaskDueToday(t);
  }).length;

  // Đếm số việc quá hạn
  const overdueCount = tasks.filter((t) => {
    if (t.completed) return false;
    const temporal = getTaskTemporalState(t);
    return temporal === "overdue" || temporal === "pastScheduled";
  }).length;

  // Đếm số việc đến hạn trong vòng 24h tới
  const dueWithin24hCount = tasks.filter((t) => {
    if (t.completed) return false;
    const temporal = getTaskTemporalState(t);
    if (temporal === "overdue" || temporal === "pastScheduled") return false;

    const normTime = normalizeTaskTimeType(t);
    const isDeadline = normTime === "deadline" || Boolean(t.deadlineTime);
    const effectiveDate = getTaskEffectiveDate(t);
    const tomorrowStr = getLocalTodayStr(new Date(Date.now() + 86400000));

    return isDeadline && (effectiveDate === todayStr || effectiveDate === tomorrowStr);
  }).length;

  const deadlineAlertTotal = overdueCount + dueWithin24hCount;

  // Đếm số ghi chú trong local storage
  const notesCount = loadNotesFromStorage().length;

  const getBadgeCount = (key: TabKey): number | null => {
    switch (key) {
      case "today":
        return pendingTodayCount;
      case "planner":
        return tasks.filter((t) => !t.completed && Boolean(getTaskEffectiveDate(t))).length;
      case "tasks":
        return tasks.filter((t) => !t.completed).length;
      case "notes":
        return notesCount + journalEntries.length;
      case "notebooks":
        return notebooks.length;
      default:
        return null;
    }
  };

  // Tiến độ hôm nay cho mini widget ở sidebar
  const todayTasksList = tasks.filter((t) => isTaskDueToday(t));
  const completedTodayCount = todayTasksList.filter((t) => t.completed).length;
  const totalTodayCount = todayTasksList.length;

  return (
    <aside
      className={`hidden md:flex flex-col justify-between h-screen sticky top-0 bg-[#F3EFE6] border-[#262626] select-none z-30 shrink-0 transition-all duration-300 ease-in-out overflow-hidden motion-reduce:transition-none ${
        isSidebarOpen
          ? "w-64 p-4 border-r-[1.5px] opacity-100 translate-x-0"
          : "w-0 p-0 border-r-0 opacity-0 -translate-x-full pointer-events-none"
      }`}
    >
      <div className="w-56 min-w-[224px] flex flex-col justify-between h-full">
        {/* 1. App Brand Logo & Version & Nút Thu Gọn Menu */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D4CEBF]">
            <BrandLogo size="md" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#78716C] bg-white px-1.5 py-0.5 rounded border border-[#D4CEBF]">
                v{CURRENT_APP_VERSION}
              </span>
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-6 h-6 rounded-[3px] bg-white hover:bg-[#FEF08A] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] transition-all cursor-pointer"
                title="Thu gọn menu bên (Ctrl + B)"
                aria-label="Thu gọn menu bên"
              >
                <PanelLeftClose size={13} strokeWidth={2.4} />
              </button>
            </div>
          </div>

        {/* 2. Primary Navigation: Hôm nay / Kế hoạch / Ghi chép / Tổng kết */}
        <nav className="space-y-1.5">
          {PRIMARY_TABS.map((tab) => {
            const isActive =
              tab.key === "today"
                ? activeTab === "tasks" && activeTaskSubTab === "today"
                : tab.key === "planner"
                ? activeTab === "tasks" && activeTaskSubTab === "planner"
                : tab.key === "notes"
                ? activeTab === "notes" || activeTab === "journal"
                : activeTab === tab.key;
            const count = getBadgeCount(tab.key);
            const IconComp = tab.icon;
            const isTaskTab = tab.key === "tasks";

            if (isTaskTab) {
              return (
                <div key={tab.key} className="space-y-1">
                  {/* Nút Task Chính */}
                  <div
                    onClick={() => {
                      onTabChange("tasks");
                      setIsTaskExpanded(true);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[4px] border-[1.5px] text-xs font-semibold transition-all duration-100 cursor-pointer ${
                      isActive
                        ? "bg-white text-[#1C1917] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[0.5px]"
                        : "bg-transparent text-[#78716C] border-transparent hover:bg-white/70 hover:text-[#1C1917] hover:border-[#D4CEBF]"
                    } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
                  >
                    <div className="flex items-center gap-2.5">
                      {!isActive && (
                        <div
                          className="w-6 h-6 rounded-[3px] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]"
                          style={{ backgroundColor: tab.accentColor }}
                        >
                          <IconComp
                            size={14}
                            strokeWidth={2.2}
                            className="text-[#1C1917]"
                          />
                        </div>
                      )}
                      <span className="tracking-tight font-bold">{tab.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {count !== null && count > 0 && (
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border ${
                            isActive
                              ? "bg-[#BAE6FD] text-[#1C1917] border-[#262626]"
                              : "bg-white text-[#78716C] border-[#D4CEBF]"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTaskExpanded(!isTaskExpanded);
                        }}
                        className="p-0.5 hover:bg-black/5 rounded text-[#78716C] transition-transform"
                        title={isTaskExpanded ? "Thu gọn mục con" : "Xổ danh sách mục con"}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isTaskExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* PHẦN XỔ XUỐNG CỦA TAB TASK: [ Hôm nay | Kế hoạch | Hạn định ] */}
                  {isTaskExpanded && (
                    <div className="ml-4 pl-2.5 border-l-[2px] border-[#D4CEBF] space-y-1 py-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* 1. Hôm nay */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTaskSubTab("today");
                          onTabChange("tasks");
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-xs transition-all ${
                          isActive && activeTaskSubTab === "today"
                            ? "bg-[#FEF08A] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626] font-bold"
                            : "bg-transparent text-[#57534E] hover:bg-white/70 hover:text-[#1C1917] border border-transparent font-medium"
                        } active:translate-y-[0.5px]`}
                      >
                        <div className="flex items-center gap-2">
                          {!(isActive && activeTaskSubTab === "today") && (
                            <Sun size={13} strokeWidth={2} className="text-amber-600" />
                          )}
                          <span>Hôm nay</span>
                        </div>
                        {pendingTodayCount > 0 && (
                          <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border leading-none ${
                            isActive && activeTaskSubTab === "today"
                              ? "bg-white text-[#1C1917] border-[#262626]"
                              : "bg-white/80 text-[#78716C] border-[#D4CEBF]"
                          }`}>
                            {pendingTodayCount}
                          </span>
                        )}
                      </button>

                      {/* 2. Kế hoạch */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTaskSubTab("planner");
                          onTabChange("tasks");
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-xs transition-all ${
                          isActive && activeTaskSubTab === "planner"
                            ? "bg-[#BAE6FD] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626] font-bold"
                            : "bg-transparent text-[#57534E] hover:bg-white/70 hover:text-[#1C1917] border border-transparent font-medium"
                        } active:translate-y-[0.5px]`}
                      >
                        <div className="flex items-center gap-2">
                          {!(isActive && activeTaskSubTab === "planner") && (
                            <CalendarIcon size={13} strokeWidth={2} className="text-sky-600" />
                          )}
                          <span>Kế hoạch</span>
                        </div>
                      </button>

                      {/* 3. Hạn định */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTaskSubTab("deadlines");
                          onTabChange("tasks");
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-xs transition-all ${
                          isActive && activeTaskSubTab === "deadlines"
                            ? "bg-[#FECDD3] text-rose-950 border border-[#262626] shadow-[1px_1px_0px_#262626] font-bold"
                            : "bg-transparent text-[#57534E] hover:bg-white/70 hover:text-[#1C1917] border border-transparent font-medium"
                        } active:translate-y-[0.5px]`}
                      >
                        <div className="flex items-center gap-2">
                          {!(isActive && activeTaskSubTab === "deadlines") && (
                            <Hourglass size={13} strokeWidth={2} className="text-rose-600" />
                          )}
                          <span>Hạn định</span>
                        </div>
                        {deadlineAlertTotal > 0 && (
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full leading-none font-bold ${
                              overdueCount > 0
                                ? "bg-rose-600 text-white animate-pulse"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {deadlineAlertTotal}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            if (tab.key === "notes") {
              const isNoteParentActive = activeTab === "notes" || activeTab === "journal";
              return (
                <div key={tab.key} className="space-y-1">
                  {/* Nút Note Chính */}
                  <div
                    onClick={() => {
                      onTabChange("notes");
                      setIsNoteExpanded(true);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[4px] border-[1.5px] text-xs font-semibold transition-all duration-100 cursor-pointer ${
                      isNoteParentActive
                        ? "bg-white text-[#1C1917] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[0.5px]"
                        : "bg-transparent text-[#78716C] border-transparent hover:bg-white/70 hover:text-[#1C1917] hover:border-[#D4CEBF]"
                    } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-[3px] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]"
                        style={{ backgroundColor: tab.accentColor }}
                      >
                        <IconComp
                          size={14}
                          strokeWidth={2.2}
                          className="text-[#1C1917]"
                        />
                      </div>
                      <span className="tracking-tight font-bold">{tab.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {count !== null && count > 0 && (
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border ${
                            isNoteParentActive
                              ? "bg-[#BBF7D0] text-[#1C1917] border-[#262626]"
                              : "bg-white text-[#78716C] border-[#D4CEBF]"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNoteExpanded(!isNoteExpanded);
                        }}
                        className="p-0.5 hover:bg-black/5 rounded text-[#78716C] transition-transform cursor-pointer"
                        title={isNoteExpanded ? "Thu gọn mục con" : "Xổ danh sách mục con"}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isNoteExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* PHẦN XỔ XUỐNG CỦA TAB NOTE: [ Ghi chú | Nhật ký ] */}
                  {isNoteExpanded && (
                    <div className="ml-4 pl-2.5 border-l-[2px] border-[#D4CEBF] space-y-1 py-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* 1. Ghi chú */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNoteSubTab("notes");
                          onTabChange("notes");
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-xs transition-all cursor-pointer ${
                          activeTab === "notes"
                            ? "bg-[#BBF7D0] text-emerald-950 border border-[#262626] shadow-[1px_1px_0px_#262626] font-bold"
                            : "bg-transparent text-[#57534E] hover:bg-white/70 hover:text-[#1C1917] border border-transparent font-medium"
                        } active:translate-y-[0.5px]`}
                      >
                        <div className="flex items-center gap-2">
                          {activeTab !== "notes" && (
                            <FileText size={13} strokeWidth={2} className="text-emerald-700" />
                          )}
                          <span>Ghi chú</span>
                        </div>
                        {notesCount > 0 && (
                          <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border leading-none ${
                            activeTab === "notes"
                              ? "bg-white text-[#1C1917] border-[#262626]"
                              : "bg-white/80 text-[#78716C] border-[#D4CEBF]"
                          }`}>
                            {notesCount}
                          </span>
                        )}
                      </button>

                      {/* 2. Nhật ký */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNoteSubTab("journal");
                          onTabChange("journal");
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-xs transition-all cursor-pointer ${
                          activeTab === "journal"
                            ? "bg-[#DDD6FE] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626] font-bold"
                            : "bg-transparent text-[#57534E] hover:bg-white/70 hover:text-[#1C1917] border border-transparent font-medium"
                        } active:translate-y-[0.5px]`}
                      >
                        <div className="flex items-center gap-2">
                          {activeTab !== "journal" && (
                            <BookOpen size={13} strokeWidth={2} className="text-purple-700" />
                          )}
                          <span>Nhật ký</span>
                        </div>
                        {journalEntries.length > 0 && (
                          <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border leading-none ${
                            activeTab === "journal"
                              ? "bg-white text-[#1C1917] border-[#262626]"
                              : "bg-white/80 text-[#78716C] border-[#D4CEBF]"
                          }`}>
                            {journalEntries.length}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[4px] border-[1.5px] text-xs font-semibold transition-all duration-100 ${
                  isActive
                    ? "bg-white text-[#1C1917] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[0.5px]"
                    : "bg-transparent text-[#78716C] border-transparent hover:bg-white/70 hover:text-[#1C1917] hover:border-[#D4CEBF]"
                } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
              >
                <div className="flex items-center gap-2.5">
                  {!isActive && (
                    <div
                      className="w-6 h-6 rounded-[3px] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]"
                      style={{ backgroundColor: tab.accentColor }}
                    >
                      <IconComp
                        size={14}
                        strokeWidth={2.2}
                        className="text-[#1C1917]"
                      />
                    </div>
                  )}
                  <span className="tracking-tight font-bold">{tab.label}</span>
                </div>

                {count !== null && count > 0 && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border ${
                      isActive
                        ? "bg-[#FEF08A] text-[#1C1917] border-[#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Nhóm "Khác" (Sổ tay, Cài đặt) */}
        <div className="mt-5 pt-4 border-t border-[#D4CEBF]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] px-3 mb-2 font-mono">
            Khác
          </p>
          <div className="space-y-1">
            {SECONDARY_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = getBadgeCount(tab.key);
              const IconComp = tab.icon;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[4px] border text-xs font-semibold transition-all duration-100 ${
                    isActive
                      ? "bg-white text-[#1C1917] border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                      : "bg-transparent text-[#78716C] border-transparent hover:bg-white/60 hover:text-[#1C1917]"
                  } active:translate-x-[0.5px] active:translate-y-[0.5px]`}
                >
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <IconComp size={14} strokeWidth={2} className="text-[#57534E]" />
                    )}
                    <span>{tab.label}</span>
                  </div>

                  {count !== null && count > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] bg-[#FAF8F3] text-[#78716C] border border-[#D4CEBF]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Bottom Mini Widget / Stats & Giới thiệu */}
      <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-black text-[#1C1917] uppercase tracking-wider">
            Tiến độ hôm nay
          </span>
          <span className="font-mono text-xs font-bold text-[#1C1917] bg-[#FEF08A] px-1.5 py-0.5 rounded border border-[#262626] shadow-[0.5px_0.5px_0px_#262626]">
            {completedTodayCount}/{totalTodayCount}
          </span>
        </div>

        <div className="w-full h-2.5 bg-[#FAF8F3] border border-[#262626] rounded-[3px] overflow-hidden p-[1px] shadow-[0.5px_0.5px_0px_#262626]">
          <div
            className="h-full bg-[#BBF7D0] border-r border-[#262626] rounded-[1px] transition-all duration-300"
            style={{
              width: `${
                totalTodayCount > 0
                  ? Math.round((completedTodayCount / totalTodayCount) * 100)
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="pt-2 border-t border-[#D4CEBF]/60">
          <p className="text-[10px] text-[#78716C] font-mono text-center">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "numeric",
              month: "numeric",
            })}{" "}
            • SketchTask
          </p>
        </div>
      </div>
      </div>
    </aside>
  );
};
