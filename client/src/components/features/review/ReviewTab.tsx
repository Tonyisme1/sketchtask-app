import React, { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../ui/Button";
import { TextInput } from "../../ui/TextInput";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { EmptyStateDoodle } from "../../ui/EmptyStateDoodle";
import { DynamicIcon } from "../../ui/DynamicIcon";
import {
  Smile,
  Sprout,
  PenLine,
  Flame,
  X,
  Sparkles,
  BarChart3,
  Trophy,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";
import { getLocalTodayStr, isTaskForDate } from "../../../utils/date";

// ==========================================
// COMPONENT: ReviewTab (Tổng Kết & Thống Kê Năng Suất Phác Thảo)
// ==========================================

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MOODS = [
  { key: "lucide:SmilePlus", label: "Tuyệt vời" },
  { key: "lucide:Smile", label: "Ổn thỏa" },
  { key: "lucide:Meh", label: "Bình thường" },
  { key: "lucide:Frown", label: "Áp lực" },
  { key: "lucide:Bed", label: "Mệt mỏi" },
];

export const ReviewTab: React.FC = () => {
  const {
    habits,
    addHabit,
    toggleHabitDay,
    deleteHabit,
    dailyMoods,
    setDailyMood,
    weeklyReflection,
    setWeeklyReflection,
    tasks,
  } = useAppStore();

  const [newHabitName, setNewHabitName] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  // Lấy 7 ngày trong tuần hiện tại
  const getCurrentWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalTodayStr(d);
      const isToday = getLocalTodayStr(now) === dateStr;

      days.push({
        label: DAY_LABELS[i],
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        date: dateStr,
        isToday,
      });
    }
    return days;
  };

  const weekDays = getCurrentWeekDates();
  const todayStr = getLocalTodayStr();
  const todayMood = dailyMoods[todayStr];

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(newHabitName.trim());
    setNewHabitName("");
  };

  // 1. Thống kê số lượng task hoàn thành từng ngày trong 7 ngày qua
  const dailyTaskStats = weekDays.map((day) => {
    const completedTasksOnDay = tasks.filter((t) => {
      if (!t.completed) return false;
      return isTaskForDate(t.dueDate, day.date);
    }).length;

    const totalTasksOnDay = tasks.filter((t) => {
      return isTaskForDate(t.dueDate, day.date);
    }).length;

    return {
      ...day,
      completedCount: completedTasksOnDay,
      totalCount: totalTasksOnDay,
    };
  });

  const maxCompleted = Math.max(1, ...dailyTaskStats.map((d) => d.completedCount));

  // 2. Tìm ngày làm việc năng suất nhất
  const bestDayStat = [...dailyTaskStats].sort((a, b) => b.completedCount - a.completedCount)[0];

  // 3. Tổng số lượt check thói quen trong tuần
  const totalHabitChecks = habits.reduce((acc, h) => {
    const checksInWeek = weekDays.filter((d) => h.completedDates.includes(d.date)).length;
    return acc + checksInWeek;
  }, 0);

  // 4. Tính Điểm Năng Suất (0 - 100)
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const completionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const productivityScore = Math.min(
    100,
    Math.round(completionRate * 0.7 + Math.min(30, totalHabitChecks * 5))
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
            Tổng Kết & Năng Suất
          </h2>
          <p className="text-[11px] text-[#78716C]">
            Theo dõi tiến độ, phân tích hiệu suất và duy trì thói quen
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold bg-[#FEF08A] px-2.5 py-1 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626]">
          <Trophy size={13} strokeWidth={2.5} className="text-amber-700" />
          <span>{productivityScore}/100 Điểm</span>
        </div>
      </div>

      {/* 2. BẢNG THỐNG KÊ & BIỂU ĐỒ NĂNG SUẤT 7 NGÀY (PHÁC THẢO MỰC) */}
      <div className="p-3.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] space-y-3">
        {/* Header Biểu Đồ */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs sm:text-sm text-[#1C1917] flex items-center gap-1.5">
            <BarChart3 size={16} strokeWidth={2.2} className="text-indigo-700" />
            <span>BIỂU ĐỒ HOÀN THÀNH (7 NGÀY)</span>
          </span>
          <span className="text-[10px] font-mono text-[#78716C] bg-[#FBF9F4] px-1.5 py-0.5 rounded border border-[#D4CEBF]">
            Tuần này
          </span>
        </div>

        {/* 4 Thẻ Chỉ Số Nhanh */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-[#FBF9F4] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
            <span className="text-[10px] text-[#78716C] flex items-center gap-1">
              <Target size={11} className="text-emerald-700" />
              <span>Tỷ lệ hoàn thành</span>
            </span>
            <p className="font-mono font-bold text-base text-[#1C1917] mt-0.5">
              {completionRate}%
            </p>
          </div>

          <div className="p-2 bg-[#FBF9F4] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
            <span className="text-[10px] text-[#78716C] flex items-center gap-1">
              <Zap size={11} className="text-amber-600" />
              <span>Ngày tốt nhất</span>
            </span>
            <p className="font-mono font-bold text-sm text-[#1C1917] mt-0.5 truncate">
              {bestDayStat && bestDayStat.completedCount > 0 ? `${bestDayStat.label} (${bestDayStat.completedCount} việc)` : "Chưa có"}
            </p>
          </div>

          <div className="p-2 bg-[#FBF9F4] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
            <span className="text-[10px] text-[#78716C] flex items-center gap-1">
              <Flame size={11} className="text-orange-600" />
              <span>Chuỗi thói quen</span>
            </span>
            <p className="font-mono font-bold text-base text-[#1C1917] mt-0.5">
              {totalHabitChecks} lượt
            </p>
          </div>

          <div className="p-2 bg-[#FBF9F4] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
            <span className="text-[10px] text-[#78716C] flex items-center gap-1">
              <TrendingUp size={11} className="text-indigo-700" />
              <span>Đánh giá</span>
            </span>
            <p className="font-bold text-xs text-[#1C1917] mt-1 truncate">
              {productivityScore >= 80 ? "Xuất sắc! 🔥" : productivityScore >= 50 ? "Khá tốt! ✨" : "Cố lên nhé! 🌱"}
            </p>
          </div>
        </div>

        {/* Biểu Đồ Cột Nét Mực 7 Ngày */}
        <div className="pt-2 border-t border-[#D4CEBF]/60">
          <div className="h-28 flex items-end justify-between gap-1.5 sm:gap-3 px-1 pt-4">
            {dailyTaskStats.map((d) => {
              const heightPercent = maxCompleted > 0 ? Math.max(12, (d.completedCount / maxCompleted) * 100) : 12;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  {/* Số lượng phía trên cột */}
                  <span className="text-[10px] font-mono font-bold text-[#78716C] group-hover:text-[#1C1917]">
                    {d.completedCount > 0 ? d.completedCount : ""}
                  </span>

                  {/* Cột biểu đồ */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[36px] rounded-t-[3px] border-[1.5px] border-[#262626] transition-all duration-300 ${
                      d.isToday
                        ? "bg-[#FEF08A] shadow-[1.5px_0px_0px_#262626]"
                        : d.completedCount > 0
                        ? "bg-[#BBF7D0] shadow-[1px_0px_0px_#262626]"
                        : "bg-[#F3EFE6] opacity-60"
                    }`}
                  />

                  {/* Nhãn Thứ & Ngày */}
                  <div className="text-center pt-1">
                    <p className={`text-[10px] font-mono leading-none ${d.isToday ? "font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2" : "text-[#78716C]"}`}>
                      {d.label}
                    </p>
                    <p className="text-[8px] font-mono text-[#A8A29E] mt-0.5">
                      {d.dayNum}/{d.monthNum}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. TÂM TRẠNG HÔM NAY (1 CHẠM LÀ XONG) */}
      <div className="p-3.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs sm:text-sm text-[#1C1917] flex items-center gap-1.5">
            <Smile size={16} strokeWidth={2.2} />
            <span>Hôm nay bạn cảm thấy thế nào?</span>
          </span>
          <span className="text-[11px] font-mono text-[#78716C]">
            {new Date().getDate()}/{new Date().getMonth() + 1}
          </span>
        </div>

        {/* 5 Nút Cảm Xúc To Rõ 1 Hàng */}
        <div className="grid grid-cols-5 gap-1.5">
          {MOODS.map((m) => {
            const isSelected = todayMood === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setDailyMood(todayStr, m.key)}
                className={`py-2 rounded-[4px] border-[1.5px] flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? "bg-[#FEF08A] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[1px] font-bold scale-105"
                    : "bg-[#FBF9F4] border-[#D4CEBF] text-[#78716C] hover:bg-white hover:border-[#262626]"
                } active:translate-y-[0.5px]`}
              >
                <DynamicIcon name={m.key} size={22} strokeWidth={2.2} />
                <span className="text-[10px] sm:text-[11px] mt-1">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dải Lịch Sử 7 Ngày Trong Tuần */}
        <div className="pt-2 border-t border-[#D4CEBF]/60 flex items-center justify-between text-xs px-1">
          {weekDays.map((d) => (
            <div key={d.date} className="flex flex-col items-center">
              <span className={`text-[10px] font-mono ${d.isToday ? "font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2" : "text-[#78716C]"}`}>
                {d.label}
              </span>
              <div className="h-5 flex items-center justify-center mt-0.5">
                {dailyMoods[d.date] ? (
                  <DynamicIcon name={dailyMoods[d.date]} size={16} strokeWidth={2.2} />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F3EFE6] border border-[#D4CEBF]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. THEO DÕI THÓI QUEN (BỐ CỤC 2 TẦNG - TÊN KHÔNG BAO GIỜ BỊ CHE) */}
      <div className="bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] overflow-hidden space-y-0">
        <div className="p-3 bg-[#F3EFE6] border-b border-[#262626] font-bold text-xs sm:text-sm flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <Sprout size={16} strokeWidth={2.2} />
            <span>THÓI QUEN (7 NGÀY)</span>
          </span>
          <span className="font-mono text-xs text-[#78716C] font-normal">
            {habits.length} thói quen
          </span>
        </div>

        {/* Ô Thêm Thói Quen */}
        <form onSubmit={handleAddHabit} className="p-3 border-b border-[#D4CEBF] flex gap-2 bg-[#FBF9F4]">
          <TextInput
            placeholder="Nhập thói quen mới (vd: Uống 2L nước, Chạy bộ 30p, Đọc sách)..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="flex-1 text-xs sm:text-sm bg-white"
          />
          <Button type="submit" variant="primary" size="md">
            + Thêm
          </Button>
        </form>

        {/* Danh Sách Thói Quen Từng Thẻ (2 Hàng) */}
        <div className="divide-y divide-[#D4CEBF]">
          {habits.length === 0 ? (
            <div className="p-6">
              <EmptyStateDoodle
                icon="lucide:Sprout"
                title="Chưa có thói quen nào"
                message="Hãy nhập thói quen bạn muốn rèn luyện phía trên để bắt đầu theo dõi nhé."
              />
            </div>
          ) : (
            habits.map((habit) => {
              const weekCompletedDays = weekDays.filter((d) =>
                habit.completedDates.includes(d.date)
              ).length;

              return (
                <div
                  key={habit.id}
                  className="p-3.5 space-y-2.5 hover:bg-[#FBF9F4] transition-colors group"
                >
                  {/* HÀNG 1: TÊN THÓI QUEN ĐẦY ĐỦ 100% */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles size={14} strokeWidth={2.2} className="text-amber-500 shrink-0" />
                      <h4 className="font-bold text-sm sm:text-base text-[#1C1917] leading-snug break-words">
                        {habit.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold bg-[#FEF08A] text-[#1C1917] px-2 py-0.5 rounded border border-[#262626] shadow-[1px_1px_0px_#262626] inline-flex items-center gap-1">
                        <Flame size={12} strokeWidth={2.2} className="text-amber-600" />
                        <span>{weekCompletedDays}/7 ngày</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeletingHabitId(habit.id)}
                        title="Xóa thói quen"
                        className="text-[#78716C] hover:text-red-600 p-1"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* HÀNG 2: 7 Ô NGÀY TRẢI ĐỀU 100% */}
                  <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                    {weekDays.map((d) => {
                      const isChecked = habit.completedDates.includes(d.date);
                      return (
                        <button
                          key={d.date}
                          type="button"
                          onClick={() => toggleHabitDay(habit.id, d.date)}
                          className={`py-2 rounded-[4px] border-[1.5px] flex flex-col items-center justify-center transition-all ${
                            isChecked
                              ? "bg-[#BBF7D0] border-[#262626] text-[#1C1917] shadow-[1px_1px_0px_#262626] font-bold"
                              : d.isToday
                              ? "bg-[#FEF08A] border-[#262626] text-[#1C1917] shadow-[1px_1px_0px_#262626] font-bold"
                              : "bg-[#F3EFE6] border-[#D4CEBF] text-[#78716C] hover:bg-white"
                          } active:translate-y-[0.5px]`}
                        >
                          <span className="text-[10px] font-mono">
                            {d.label}
                          </span>
                          <span className="text-xs font-bold mt-0.5">
                            {isChecked ? "✓" : "○"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. GHI CHÉP ĐÚC KẾT TUẦN */}
      <div className="p-3.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-[#D4CEBF]">
          <h3 className="font-bold text-xs sm:text-sm text-[#1C1917] flex items-center gap-1.5">
            <PenLine size={16} strokeWidth={2.2} />
            <span>Đúc kết tuần này</span>
          </h3>
          {reflectionSaved && (
            <span className="text-[10px] font-mono text-emerald-800 bg-[#BBF7D0] px-2 py-0.5 rounded font-bold border border-[#262626]">
              ✓ Đã lưu
            </span>
          )}
        </div>

        <textarea
          rows={3}
          value={weeklyReflection}
          onChange={(e) => {
            setWeeklyReflection(e.target.value);
            setReflectionSaved(true);
            setTimeout(() => setReflectionSaved(false), 2000);
          }}
          placeholder="Viết một vài dòng đúc kết cảm nhận của bạn trong tuần..."
          className="w-full p-2.5 bg-[#FBF9F4] border border-[#262626] rounded-[4px] text-xs sm:text-sm text-[#1C1917] font-serif italic outline-none leading-relaxed"
        />
      </div>

      {/* Modal Xóa Thói Quen */}
      <ConfirmModal
        isOpen={deletingHabitId !== null}
        title="Xóa thói quen"
        message="Bạn có chắc muốn xóa thói quen này không?"
        onConfirm={() => {
          if (deletingHabitId) deleteHabit(deletingHabitId);
          setDeletingHabitId(null);
        }}
        onCancel={() => setDeletingHabitId(null)}
      />
    </div>
  );
};
