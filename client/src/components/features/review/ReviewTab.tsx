import React, { useState, useMemo } from "react";
import {
  Flame,
  CheckCircle2,
  Sparkles,
  BookOpen,
  TrendingUp,
  Award,
  Plus,
  Edit3,
  Trash2,
  X,
  Layers,
  Check,
  User,
  Settings,
} from "lucide-react";
import { TabKey, HabitDto, TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { getLocalTodayStr, formatShortDayMonth } from "../../../utils/date";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { getTagStyle } from "../../../utils/tagColors";
import { DynamicIcon } from "../../ui";

interface ReviewTabProps {
  onNavigateTab?: (tab: TabKey) => void;
  onNavigateRoute?: (path: string) => void;
}

type TimeHorizon = "week" | "month" | "all";

const SHORT_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const ReviewTab: React.FC<ReviewTabProps> = ({ onNavigateTab, onNavigateRoute }) => {
  const {
    user,
    tasks,
    habits,
    notebooks,
    journalEntries,
    weeklyReflection,
    setWeeklyReflection,
    toggleHabitDay,
    addHabit,
    updateHabit,
    deleteHabit,
    openAuthModal,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // Bộ lọc khung thời gian
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("week");

  // State cho Modal Quản lý thói quen
  const [isHabitManagerOpen, setIsHabitManagerOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [draftHabitName, setDraftHabitName] = useState("");
  const [draftFrequency, setDraftFrequency] = useState<HabitDto["frequency"]>("daily");

  // State thông báo lưu phản tư
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useScrollLock(isHabitManagerOpen);

  // ==========================================
  // 1. TÍNH TOÁN DANH SÁCH NGÀY THEO KHUNG THỜI GIAN
  // ==========================================
  const currentWeekDays = useMemo(() => {
    const monday = new Date(now);
    const dayOfWeek = monday.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + diffToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalTodayStr(d);
      days.push({
        dateStr,
        dayName: SHORT_DAYS[i],
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [now, todayStr]);

  const weekDatesList = useMemo(() => currentWeekDays.map((d) => d.dateStr), [currentWeekDays]);

  // ==========================================
  // 2. LỌC TẬP TASK THEO KHUNG THỜI GIAN (TUẦN / THÁNG / TOÀN BỘ)
  // ==========================================
  const currentPeriodTasks = useMemo(() => {
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    return tasks.filter((t) => {
      const effectiveDate = t.dueDate ? t.dueDate.split(" ")[0] : t.createdAt?.split("T")[0] || "";
      if (timeHorizon === "week") {
        return weekDatesList.includes(effectiveDate);
      }
      if (timeHorizon === "month") {
        return effectiveDate.startsWith(currentMonthPrefix);
      }
      return true; // "all"
    });
  }, [tasks, timeHorizon, weekDatesList, todayStr]);

  // Các việc đã hoàn thành trong kỳ
  const completedPeriodTasks = useMemo(() => {
    return currentPeriodTasks.filter((t) => t.completed);
  }, [currentPeriodTasks]);

  // Các việc còn đang làm trong kỳ
  const pendingPeriodTasks = useMemo(() => {
    return currentPeriodTasks.filter((t) => !t.completed);
  }, [currentPeriodTasks]);

  const totalPeriodTasks = currentPeriodTasks.length;
  const completedCount = completedPeriodTasks.length;
  const completionRate = totalPeriodTasks > 0 ? Math.round((completedCount / totalPeriodTasks) * 100) : 0;

  // Hiệu suất trung bình mỗi ngày
  const dailyVelocity = (completedCount / (timeHorizon === "week" ? 7 : timeHorizon === "month" ? 30 : 60)).toFixed(1);

  // ==========================================
  // 3. THỐNG KÊ BIỂU ĐỒ NĂNG SUẤT 7 NGÀY
  // ==========================================
  const dailyActivityStats = useMemo(() => {
    const dailyCounts = currentWeekDays.map((day) => {
      const count = tasks.filter((t) => {
        if (!t.completed) return false;
        const effectiveDate = t.dueDate ? t.dueDate.split(" ")[0] : "";
        return effectiveDate === day.dateStr;
      }).length;
      return {
        ...day,
        count,
      };
    });

    const maxDailyCount = Math.max(...dailyCounts.map((d) => d.count), 1);
    return { dailyCounts, maxDailyCount };
  }, [tasks, currentWeekDays]);

  // ==========================================
  // 4. PHÂN TÍCH PHÂN BỔ 3 CHIỀU: SỔ TAY, NHÃN & ƯU TIÊN
  // ==========================================

  // (A) Phân bổ theo Sổ Tay
  const notebookDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completedPeriodTasks.forEach((t) => {
      const key = t.notebookId || "inbox";
      counts[key] = (counts[key] || 0) + 1;
    });

    return notebooks.map((nb) => {
      const count = counts[nb.id] || 0;
      const percent = completedCount > 0 ? Math.round((count / completedCount) * 100) : 0;
      return {
        id: nb.id,
        name: nb.name,
        color: nb.color,
        count,
        percent,
      };
    }).filter((item) => item.count > 0);
  }, [completedPeriodTasks, notebooks, completedCount]);

  // (B) Phân bổ theo Nhãn (#Tag)
  const tagDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completedPeriodTasks.forEach((t) => {
      if (t.tag) {
        counts[t.tag] = (counts[t.tag] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([tag, count]) => ({
        tag,
        count,
        percent: completedCount > 0 ? Math.round((count / completedCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [completedPeriodTasks, completedCount]);

  // (C) Phân bổ theo Mức Độ Ưu Tiên
  const priorityDistribution = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    completedPeriodTasks.forEach((t) => {
      const p = t.priority || "medium";
      if (p === "high") high++;
      else if (p === "low") low++;
      else medium++;
    });

    return {
      high,
      medium,
      low,
      highPercent: completedCount > 0 ? Math.round((high / completedCount) * 100) : 0,
      mediumPercent: completedCount > 0 ? Math.round((medium / completedCount) * 100) : 0,
      lowPercent: completedCount > 0 ? Math.round((low / completedCount) * 100) : 0,
    };
  }, [completedPeriodTasks, completedCount]);

  // ==========================================
  // 5. THỐNG KÊ THÓI QUEN KỶ LUẬT TUẦN
  // ==========================================
  const weeklyHabitStats = useMemo(() => {
    if (habits.length === 0) return { completionRate: 0, totalChecks: 0, maxStreak: 0 };

    let totalPossible = habits.length * 7;
    let totalChecks = 0;
    let maxStreak = 0;

    habits.forEach((habit) => {
      if (habit.streak && habit.streak > maxStreak) maxStreak = habit.streak;
      weekDatesList.forEach((dateStr) => {
        if (habit.completedDates?.includes(dateStr)) totalChecks++;
      });
    });

    const rate = Math.round((totalChecks / totalPossible) * 100);
    return { completionRate: rate, totalChecks, maxStreak };
  }, [habits, weekDatesList]);

  // Submit sửa/tạo thói quen
  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftHabitName.trim()) return;
    if (editingHabitId) {
      updateHabit(editingHabitId, { name: draftHabitName.trim(), frequency: draftFrequency });
    } else {
      addHabit(draftHabitName.trim(), draftFrequency);
    }
    setEditingHabitId(null);
    setDraftHabitName("");
  };

  const handleReflectionChange = (text: string) => {
    setWeeklyReflection(text);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <div className="w-full min-w-0 space-y-4 pb-20 select-none animate-in fade-in duration-150">
      {/* 0. Khối Profile Cá Nhân Chuẩn YouTube "You" */}
      <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 sm:p-5 shadow-[2.5px_2.5px_0px_#262626] space-y-3.5">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] border-[1.5px] border-[#262626] flex items-center justify-center shadow-[2px_2px_0px_#262626] shrink-0 -rotate-1"
            style={{ backgroundColor: user.avatarBg || "#DDD6FE" }}
          >
            <DynamicIcon name={user.avatar || "lucide:User"} size={30} strokeWidth={2.2} className="text-[#1C1917]" />
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-[#1C1917] truncate leading-tight">
                {user.name}
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#1C1917] border border-[#262626] font-bold shrink-0">
                {user.isSignedIn ? "Thành viên" : "Khách"}
              </span>
            </div>
            <p className="text-xs text-[#78716C] font-mono truncate">
              {user.isSignedIn ? user.email : "@khach_chua_dang_nhap"}
            </p>
          </div>
        </div>

        {/* 2 Nút Hành Động Chuẩn YouTube: [ Quản lý tài khoản ] và [ Cài đặt hệ thống ] */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              openAuthModal();
            }}
            className="w-full py-2 px-3 rounded-[6px] bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] text-xs font-bold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all truncate"
          >
            <User size={14} strokeWidth={2.2} />
            <span className="truncate">{user.isSignedIn ? "Tài khoản" : "Đăng nhập"}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.("settings")}
            className="w-full py-2 px-3 rounded-[6px] bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] text-xs font-bold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all truncate"
          >
            <Settings size={14} strokeWidth={2.2} />
            <span className="truncate">Cài đặt</span>
          </button>
        </div>
      </div>

      {/* 1. Bộ Lọc Khung Thời Gian (Xếp dọc: Tiêu đề ở trên, thanh chọn ở dưới) */}
      <div className="space-y-2 pt-1 pb-1">
        <div className="flex items-center gap-1.5 text-xs font-black text-[#1C1917] uppercase tracking-wider font-mono">
          <TrendingUp size={15} strokeWidth={2.4} className="text-[#1C1917]" />
          <span>Thống kê năng suất</span>
        </div>

        {/* Thanh chuyển đổi khung thời gian: Tuần này | Tháng này | Tất cả */}
        <div className="grid grid-cols-3 gap-1 bg-[#FAF8F3] border-[1.5px] border-[#262626] p-1 rounded-[6px] shadow-[1.5px_1.5px_0px_#262626]">
          <button
            type="button"
            onClick={() => setTimeHorizon("week")}
            className={`py-1.5 px-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer text-center active:translate-y-[0.5px] ${
              timeHorizon === "week"
                ? "bg-[#FEF08A] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setTimeHorizon("month")}
            className={`py-1.5 px-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer text-center active:translate-y-[0.5px] ${
              timeHorizon === "month"
                ? "bg-[#BAE6FD] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setTimeHorizon("all")}
            className={`py-1.5 px-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer text-center active:translate-y-[0.5px] ${
              timeHorizon === "all"
                ? "bg-[#BBF7D0] text-emerald-950 border border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* 2. KHỐI 4 THẺ CHỈ SỐ NĂNG SUẤT CỐT LÕI (CORE PRODUCTIVITY METRICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Tỷ lệ hoàn thành */}
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3 sm:p-3.5 shadow-[2px_2px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-700" strokeWidth={2.4} />
              <span>Hoàn thành</span>
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#BBF7D0] border border-[#262626] rounded">
              {completionRate}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#1C1917]">
              {completedCount}/{totalPeriodTasks}
            </span>
            <span className="text-xs text-[#78716C]">đã xong</span>
          </div>
        </div>

        {/* Card 2: Tốc độ xử lý công việc */}
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3 sm:p-3.5 shadow-[2px_2px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <TrendingUp size={14} className="text-sky-700" strokeWidth={2.4} />
              <span>Tốc độ</span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#1C1917]">
              {dailyVelocity}
            </span>
            <span className="text-xs text-[#78716C]">việc / ngày</span>
          </div>
        </div>

        {/* Card 3: Kỷ luật thói quen */}
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3 sm:p-3.5 shadow-[2px_2px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <Flame size={14} className="text-orange-600" strokeWidth={2.4} />
              <span>Thói quen</span>
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#FED7AA] border border-[#262626] rounded">
              <span className="inline-flex items-center gap-1">
                <Flame size={10} strokeWidth={2.4} />
                {weeklyHabitStats.maxStreak} ngày
              </span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#1C1917]">
              {weeklyHabitStats.completionRate}%
            </span>
            <span className="text-xs text-[#78716C]">đạt</span>
          </div>
        </div>

        {/* Card 4: Ghi chép & Đúc kết */}
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3 sm:p-3.5 shadow-[2px_2px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <BookOpen size={14} className="text-purple-700" strokeWidth={2.4} />
              <span>Nhật ký</span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#1C1917]">
              {journalEntries.length}
            </span>
            <span className="text-xs text-[#78716C]">bài viết</span>
          </div>
        </div>
      </div>

      {/* 3. BỐ CỤC 2 CỘT: (TRÁI) BIỂU ĐỒ & THÓI QUEN  -  (PHẢI) PHÂN BỔ & SỔ PHẢN TƯ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CỘT TRÁI (7 PHẦN): Biểu đồ năng suất 7 ngày + Ma trận thói quen */}
        <div className="lg:col-span-7 space-y-4">
          {/* (A) BIỂU ĐỒ NĂNG SUẤT 7 NGÀY GẦN NHẤT */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#1C1917]">
                <TrendingUp size={16} className="text-sky-700" strokeWidth={2.4} />
                <span>Hoàn thành 7 ngày</span>
              </div>
              <span className="text-[10px] text-[#78716C] font-mono">
                {completedCount} việc
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2 items-end min-h-[140px] px-1">
              {dailyActivityStats.dailyCounts.map((day) => {
                const barHeight =
                  day.count > 0
                    ? Math.max(Math.round((day.count / dailyActivityStats.maxDailyCount) * 90), 16)
                    : 6;

                return (
                  <div key={day.dateStr} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="font-mono text-[10px] font-bold text-[#1C1917]">
                      {day.count > 0 ? day.count : ""}
                    </span>
                    <div
                      className={`w-full rounded-[4px] border-[1.5px] border-[#262626] transition-all ${
                        day.isToday
                          ? "bg-[#FEF08A] shadow-[1.5px_1.5px_0px_#262626]"
                          : day.count > 0
                          ? "bg-[#BAE6FD] shadow-[1px_1px_0px_#262626]"
                          : "bg-[#F3EFE6] border-dashed border-[#D4CEBF]"
                      }`}
                      style={{ height: `${barHeight}px` }}
                      title={`${day.dayName} (${day.dayNum}): ${day.count} việc hoàn thành`}
                    />
                    <div className="text-center">
                      <span
                        className={`text-[10px] sm:text-xs font-bold block ${
                          day.isToday ? "text-[#1C1917]" : "text-[#78716C]"
                        }`}
                      >
                        {day.dayName}
                      </span>
                      <span className="text-[9px] font-mono text-[#A8A29E]">
                        {day.dayNum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* (B) BẢNG MA TRẬN THÓI QUEN TUẦN NÀY (7-Day Habit Discipline Grid) */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#1C1917]">
                <Flame size={16} className="text-orange-600" strokeWidth={2.4} />
                <span>Thói quen tuần ({habits.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHabitManagerOpen(true)}
                className="px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-[10px] font-bold text-[#1C1917] flex items-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
              >
                <Plus size={11} strokeWidth={2.6} />
                <span>Quản lý</span>
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="py-6 text-center text-[#78716C] space-y-1.5">
                <p className="text-xs font-bold text-[#1C1917]">Chưa có thói quen</p>
                <p className="text-[11px]">Thêm thói quen để theo dõi chuỗi ngày kỷ luật.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-x-auto no-scrollbar">
                {/* Header 7 ngày */}
                <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-[#78716C] pb-1 border-b border-[#262626]/20 font-mono">
                  <span className="col-span-5 truncate">Thói quen</span>
                  {currentWeekDays.map((day) => (
                    <span
                      key={day.dateStr}
                      className={`col-span-1 text-center ${
                        day.isToday ? "text-[#1C1917] font-black underline" : ""
                      }`}
                    >
                      {day.dayName}
                    </span>
                  ))}
                </div>

                {/* Danh sách các dòng thói quen */}
                {habits.map((habit) => {
                  return (
                    <div
                      key={habit.id}
                      className="grid grid-cols-12 gap-1 items-center p-1.5 bg-[#FAF8F3] hover:bg-[#F3EFE6] border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626]"
                    >
                      <div className="col-span-5 flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="text-xs font-bold text-[#1C1917] truncate">
                          {habit.name}
                        </span>
                        {habit.streak && habit.streak > 0 ? (
                          <span className="text-[9px] font-mono font-bold text-orange-800 shrink-0">
                            <span className="inline-flex items-center gap-0.5">
                              <Flame size={9} strokeWidth={2.4} />
                              {habit.streak}
                            </span>
                          </span>
                        ) : null}
                      </div>

                      {/* 7 Ô Checkbox cho 7 ngày */}
                      {currentWeekDays.map((day) => {
                        const isDone = habit.completedDates?.includes(day.dateStr);
                        return (
                          <div
                            key={day.dateStr}
                            className="col-span-1 flex items-center justify-center"
                          >
                            <button
                              type="button"
                              onClick={() => toggleHabitDay(habit.id, day.dateStr)}
                              className={`w-6 h-6 rounded-[3px] border transition-all flex items-center justify-center text-xs active:scale-90 cursor-pointer ${
                                isDone
                                  ? "bg-[#BBF7D0] border-[#262626] text-emerald-950 font-bold shadow-[0.5px_0.5px_0px_#262626]"
                                  : "bg-white border-[#D4CEBF] text-transparent hover:border-[#262626]"
                              }`}
                              title={`${habit.name} - ${day.dayName} (${day.dayNum})`}
                            >
                              {isDone ? <Check size={12} strokeWidth={3} /> : null}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (5 PHẦN): Phân tích chi tiết 3 chiều & Sổ phản tư chiến lược */}
        <div className="lg:col-span-5 space-y-4">
          {/* (A) SỔ PHẢN TƯ & ĐÚC KẾT CHIẾN LƯỢC */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#262626] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#1C1917]">
                <Sparkles size={16} className="text-amber-700" strokeWidth={2.4} />
                <span>Ghi chú tuần</span>
              </div>
              {isSavedNotice && (
                <span className="text-[10px] text-emerald-800 font-bold animate-in fade-in">
                  <span className="inline-flex items-center gap-1">
                    <Check size={11} strokeWidth={3} />
                    Đã lưu
                  </span>
                </span>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={weeklyReflection}
                onChange={(e) => handleReflectionChange(e.target.value)}
                placeholder="Nhập ..... của bạn "
                rows={3}
                className="w-full p-2.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:bg-[#FFFDF8] shadow-[1.5px_1.5px_0px_#262626] resize-none leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* (B) PHÂN BỔ KHỐI LƯỢNG THEO SỔ TAY & NHÃN */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#1C1917]">
                <Layers size={15} className="text-[#57534E]" />
                <span>Phân bổ công việc</span>
              </div>
            </div>

            {/* Phân bổ Sổ tay */}
            {notebookDistribution.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider font-mono block">
                  Theo Sổ tay:
                </span>
                <div className="space-y-1.5">
                  {notebookDistribution.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                        <span className="truncate">{item.name}</span>
                        <span className="font-mono text-[11px] text-[#57534E]">
                          {item.count} việc ({item.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#FAF8F3] border border-[#262626] rounded-[2px] overflow-hidden">
                        <div
                          className="h-full bg-[#DDD6FE] border-r border-[#262626]"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phân bổ Nhãn */}
            {tagDistribution.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#262626]/10">
                <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider font-mono block">
                  Theo Nhãn (#Tag):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tagDistribution.map((item) => (
                    <span
                      key={item.tag}
                      style={getTagStyle(item.tag)}
                      className="px-2 py-0.5 rounded border border-[#262626] font-bold text-[10px] shadow-[0.5px_0.5px_0px_#262626]"
                    >
                      #{item.tag} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Phân bổ Mức độ Ưu tiên */}
            <div className="space-y-1.5 pt-2 border-t border-[#262626]/10">
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider font-mono block">
                Độ ưu tiên:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[10px]">
                <div className="p-1 bg-rose-50 border border-rose-300 rounded text-rose-950">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Gấp: {priorityDistribution.high}
                  </span>
                </div>
                <div className="p-1 bg-amber-50 border border-amber-300 rounded text-amber-950">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Vừa: {priorityDistribution.medium}
                  </span>
                </div>
                <div className="p-1 bg-emerald-50 border border-emerald-300 rounded text-emerald-950">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Thấp: {priorityDistribution.low}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* (C) BẢNG VÀNG THÀNH TỰU ĐÃ HOÀN THÀNH */}
          {completedPeriodTasks.length > 0 && (
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#1C1917]">
                  <Award size={15} className="text-amber-700" />
                  <span>Vừa hoàn thành</span>
                </div>
                <span className="text-[10px] font-mono text-[#78716C]">
                  {completedPeriodTasks.length} việc
                </span>
              </div>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                {completedPeriodTasks.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 p-1.5 bg-[#FAF8F3] border border-[#262626] rounded-[4px] text-xs font-bold text-[#1C1917]"
                  >
                    <Check size={12} className="text-emerald-700" strokeWidth={3} />
                    <span className="line-through text-[#57534E] truncate flex-1 font-medium">
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL QUẢN LÝ THÓI QUEN */}
      {isHabitManagerOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 md:items-center md:p-6 animate-in fade-in duration-150"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsHabitManagerOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-t-[18px] md:rounded-[8px] shadow-[3px_3px_0px_#262626] p-4 animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b-[1.5px] border-[#262626]">
              <div>
                <h2 className="text-base font-bold text-[#1C1917]">Quản lý thói quen</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHabitManagerOpen(false)}
                className="w-8 h-8 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-center hover:bg-[#FECDD3] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>

            <form onSubmit={handleHabitSubmit} className="space-y-3">
              <div>
                <label className="block mb-1 text-[11px] font-bold text-[#1C1917]">
                  Tên thói quen
                </label>
                <input
                  value={draftHabitName}
                  onChange={(e) => setDraftHabitName(e.target.value)}
                  placeholder="Ví dụ: Uống 2L nước, Đọc 15 trang sách..."
                  className="w-full h-9 px-2.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-xs text-[#1C1917] outline-none focus:ring-1 focus:ring-[#262626]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingHabitId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHabitId(null);
                      setDraftHabitName("");
                    }}
                    className="h-9 px-3 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-xs font-bold active:translate-x-[0.5px] active:translate-y-[0.5px]"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!draftHabitName.trim()}
                  className="h-9 px-3.5 bg-[#BBF7D0] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold text-emerald-950 disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  {editingHabitId ? "Lưu thay đổi" : "+ Thêm thói quen"}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-[#D4CEBF] space-y-2">
              <p className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                Danh sách thói quen ({habits.length})
              </p>
              {habits.length === 0 ? (
                <p className="text-xs text-[#78716C] py-2">Chưa có thói quen nào.</p>
              ) : (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2 p-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-[#1C1917]">{habit.name}</p>
                      <p className="text-[10px] text-[#78716C]">
                        {habit.frequency === "daily" ? "Mỗi ngày" : "Mỗi tuần"} ·
                        <Flame size={10} className="text-orange-600" strokeWidth={2.4} />
                        {habit.streak || 0} ngày liên tiếp
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHabitId(habit.id);
                        setDraftHabitName(habit.name);
                        setDraftFrequency(habit.frequency);
                      }}
                      className="w-7 h-7 bg-[#BAE6FD] border border-[#262626] rounded-[4px] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      <Edit3 size={13} strokeWidth={2.3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHabit(habit.id)}
                      className="w-7 h-7 bg-[#FECDD3] border border-[#262626] rounded-[4px] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      <Trash2 size={13} strokeWidth={2.3} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
