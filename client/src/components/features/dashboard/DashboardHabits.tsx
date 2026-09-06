import React, { useState } from "react";
import { CheckCircle2, Edit3, Flame, Plus, Trash2, X } from "lucide-react";
import { HabitDto, TabKey } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { getLocalTodayStr } from "../../../utils/date";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";

interface DashboardHabitsProps {
  habits: HabitDto[];
  onToggleHabitDay: (habitId: string, dateStr: string) => void;
  onNavigateTab?: (tab: TabKey) => void;
}

const frequencyOptions: Array<{ value: HabitDto["frequency"]; label: string }> = [
  { value: "daily", label: "Mỗi ngày" },
  { value: "weekly", label: "Mỗi tuần" },
];

export const DashboardHabits: React.FC<DashboardHabitsProps> = ({
  habits,
  onToggleHabitDay,
}) => {
  const { addHabit, updateHabit, deleteHabit } = useAppStore();
  const todayStr = getLocalTodayStr();
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftFrequency, setDraftFrequency] = useState<HabitDto["frequency"]>("daily");

  useScrollLock(isManagerOpen);

  const completedTodayCount = habits.filter((habit) =>
    habit.completedDates?.includes(todayStr),
  ).length;
  const totalHabits = habits.length;
  const isAllDone = totalHabits > 0 && completedTodayCount === totalHabits;

  const resetEditor = () => {
    setEditingHabitId(null);
    setDraftName("");
    setDraftFrequency("daily");
  };

  const openManager = () => {
    resetEditor();
    setIsManagerOpen(true);
  };

  const closeManager = () => {
    setIsManagerOpen(false);
    resetEditor();
  };

  const startEditing = (habit: HabitDto) => {
    setEditingHabitId(habit.id);
    setDraftName(habit.name);
    setDraftFrequency(habit.frequency);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;

    if (editingHabitId) {
      updateHabit(editingHabitId, { name, frequency: draftFrequency });
    } else {
      addHabit(name, draftFrequency);
    }
    resetEditor();
  };

  return (
    <>
      <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#262626] mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <Flame size={16} className="text-orange-600 shrink-0" strokeWidth={2.4} />
              <h2 className="text-xs sm:text-sm font-bold text-[#1C1917] uppercase tracking-wider font-mono truncate">
                Thói quen hôm nay
              </h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-[#262626] shadow-[0.5px_0.5px_0px_#262626] ${
                  isAllDone
                    ? "bg-[#BBF7D0] text-emerald-950"
                    : "bg-[#FEF08A] text-[#1C1917]"
                }`}
              >
                {completedTodayCount}/{totalHabits} XONG
              </span>
              <button
                type="button"
                onClick={openManager}
                className="h-7 px-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-[10px] font-bold text-[#1C1917] flex items-center gap-1 hover:bg-[#BBF7D0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <Plus size={12} strokeWidth={2.6} />
                <span>Quản lý</span>
              </button>
            </div>
          </div>

          {totalHabits === 0 ? (
            <div className="py-5 flex flex-col items-center justify-center text-center space-y-2 text-[#78716C]">
              <p className="text-xs font-bold text-[#1C1917]">Chưa có thói quen nào</p>
              <p className="text-[11px]">Tạo một thói quen nhỏ để bắt đầu theo dõi chuỗi duy trì.</p>
              <button
                type="button"
                onClick={openManager}
                className="px-2.5 py-1.5 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-[10px] font-bold text-[#1C1917] flex items-center gap-1 hover:bg-[#FDE047] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <Plus size={12} strokeWidth={2.6} />
                Tạo thói quen
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map((habit) => {
                const isCompletedToday = habit.completedDates?.includes(todayStr);
                const streak = habit.streak || 0;

                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between gap-2.5 p-2 sm:p-2.5 border border-[#262626] rounded-[6px] transition-all shadow-[1px_1px_0px_#262626] ${
                      isCompletedToday
                        ? "bg-[#F0FDF4] opacity-90"
                        : "bg-[#FAF8F3] hover:bg-[#F5F2EA]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <HandDrawnCheckbox
                        checked={isCompletedToday}
                        onChange={() => onToggleHabitDay(habit.id, todayStr)}
                      />
                      <span
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCompletedToday ? "text-[#57534E]" : "text-[#1C1917]"
                        }`}
                      >
                        {habit.name}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded-[3px] border border-[#262626] text-[10px] font-bold font-mono flex items-center gap-1 shadow-[0.5px_0.5px_0px_#262626] ${
                        streak >= 3 ? "bg-[#FED7AA] text-[#7C2D12]" : "bg-white text-[#78716C]"
                      }`}
                    >
                      <Flame size={10} strokeWidth={2.4} />
                      <span>{streak} ngày</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2.5 mt-2.5 border-t border-[#E7E5E4] flex items-center justify-between text-[11px] text-[#78716C] font-mono">
          <span>{isAllDone ? "Tuyệt vời! Đã hoàn thành hôm nay." : "Chạm để điểm danh tiếp"}</span>
          {isAllDone && (
            <span className="flex items-center gap-1 text-emerald-800 font-bold">
              <CheckCircle2 size={12} strokeWidth={2.4} />
              <span>Hoàn tất</span>
            </span>
          )}
        </div>
      </div>

      {isManagerOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 md:items-center md:p-6 animate-in fade-in duration-150"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeManager();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="habit-manager-title"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-t-[18px] md:rounded-[8px] shadow-[3px_3px_0px_#262626] p-4 animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#D4CEBF] rounded-full mx-auto mb-3 md:hidden" />
            <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b-[1.5px] border-[#262626]">
              <div>
                <h2 id="habit-manager-title" className="text-base font-bold text-[#1C1917]">Quản lý thói quen</h2>
                <p className="text-[11px] text-[#78716C] mt-0.5">Thiết lập những việc lặp lại bạn muốn duy trì.</p>
              </div>
              <button
                type="button"
                onClick={closeManager}
                className="w-8 h-8 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-center hover:bg-[#FECDD3] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                aria-label="Đóng quản lý thói quen"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label htmlFor="habit-name" className="block mb-1 text-[11px] font-bold text-[#1C1917]">Tên thói quen</label>
                <input
                  id="habit-name"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Ví dụ: Uống đủ nước"
                  className="w-full h-9 px-2.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-xs text-[#1C1917] outline-none focus:ring-1 focus:ring-[#262626]"
                />
              </div>

              <div>
                <span className="block mb-1 text-[11px] font-bold text-[#1C1917]">Tần suất</span>
                <div className="grid grid-cols-2 gap-2">
                  {frequencyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraftFrequency(option.value)}
                      className={`h-9 border-[1.5px] border-[#262626] rounded-[4px] text-xs font-bold active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${
                        draftFrequency === option.value
                          ? "bg-[#FEF08A] shadow-[1px_1px_0px_#262626] text-[#1C1917]"
                          : "bg-white text-[#78716C] hover:bg-[#FAF8F3]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingHabitId && (
                  <button
                    type="button"
                    onClick={resetEditor}
                    className="h-9 px-3 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!draftName.trim()}
                  className="h-9 px-3 bg-[#BBF7D0] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold text-emerald-950 disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  {editingHabitId ? "Lưu thay đổi" : "Tạo thói quen"}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-[#D4CEBF] space-y-2">
              <p className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">Đã thiết lập ({habits.length})</p>
              {habits.length === 0 ? (
                <p className="text-xs text-[#78716C] py-2">Danh sách đang trống.</p>
              ) : (
                habits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2 p-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-[#1C1917]">{habit.name}</p>
                      <p className="text-[10px] text-[#78716C]">{habit.frequency === "daily" ? "Mỗi ngày" : "Mỗi tuần"} · {habit.streak || 0} ngày liên tiếp</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditing(habit)}
                      className="w-7 h-7 bg-[#BAE6FD] border border-[#262626] rounded-[4px] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      aria-label={`Sửa ${habit.name}`}
                    >
                      <Edit3 size={13} strokeWidth={2.3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHabit(habit.id)}
                      className="w-7 h-7 bg-[#FECDD3] border border-[#262626] rounded-[4px] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      aria-label={`Xóa ${habit.name}`}
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
    </>
  );
};
