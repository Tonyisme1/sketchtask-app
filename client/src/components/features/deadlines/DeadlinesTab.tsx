import React, { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto } from "../../../types";
import { getLocalTodayStr, getLocalTomorrowStr, formatFullDate } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import { TaskList } from "../shared/TaskList";
import {
  Hourglass,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  CalendarX,
  BellRing,
} from "lucide-react";

export interface DeadlinesTabProps {
  onNavigateToTaskDate?: (dateStr: string, taskId: string) => void;
}

export const DeadlinesTab: React.FC<DeadlinesTabProps> = ({
  onNavigateToTaskDate,
}) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
  } = useAppStore();

  const todayStr = getLocalTodayStr(new Date());
  const tomorrowStr = getLocalTomorrowStr();

  // 3 Sub-tabs: "overdue_deadline" (Quá hạn chót) | "overdue_date" (Quá ngày hẹn) | "within_24h" (Đến hạn trong 24h)
  const [subTab, setSubTab] = useState<"overdue_deadline" | "overdue_date" | "within_24h">("overdue_deadline");

  // 1. Phân loại: QUÁ HẠN CHÓT (Overdue Deadline)
  const overdueDeadlineTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      const normTime = normalizeTaskTimeType(t);

      return normTime === "deadline" && temporal === "overdue";
    });
  }, [tasks]);

  // 2. Phân loại: QUÁ NGÀY HẸN (Overdue Date)
  const overdueDateTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      const normTime = normalizeTaskTimeType(t);

      return normTime !== "deadline" && (temporal === "overdue" || temporal === "pastScheduled");
    });
  }, [tasks]);

  // 3. Phân loại: ĐẾN HẠN TRONG 24H (Due within 24 hours)
  const dueWithin24hTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      if (temporal === "overdue" || temporal === "pastScheduled") return false;

      const normTime = normalizeTaskTimeType(t);
      const effectiveDate = getTaskEffectiveDate(t);

      if (normTime === "deadline") {
        return effectiveDate === todayStr || effectiveDate === tomorrowStr;
      }
      return false;
    });
  }, [tasks, todayStr, tomorrowStr]);

  // Gom nhóm Quá hạn chót theo ngày hiệu lực (từ ngày cũ nhất đến ngày gần nhất)
  const groupedOverdueDeadlines = useMemo(() => {
    const map: Record<string, TaskDto[]> = {};
    for (const t of overdueDeadlineTasks) {
      const d = getTaskEffectiveDate(t) || "no-date";
      if (!map[d]) map[d] = [];
      map[d].push(t);
    }
    const sortedDates = Object.keys(map).sort((a, b) => a.localeCompare(b));
    return sortedDates.map((dateStr) => {
      const sortedGroupTasks = [...map[dateStr]].sort((a, b) => {
        const timeA = getTaskEffectiveTime(a) || "99:99";
        const timeB = getTaskEffectiveTime(b) || "99:99";
        return timeA.localeCompare(timeB);
      });
      return {
        dateStr,
        tasks: sortedGroupTasks,
      };
    });
  }, [overdueDeadlineTasks]);

  // Gom nhóm Quá ngày hẹn theo ngày hiệu lực (từ ngày cũ nhất đến ngày gần nhất)
  const groupedOverdueDates = useMemo(() => {
    const map: Record<string, TaskDto[]> = {};
    for (const t of overdueDateTasks) {
      const d = getTaskEffectiveDate(t) || "no-date";
      if (!map[d]) map[d] = [];
      map[d].push(t);
    }
    const sortedDates = Object.keys(map).sort((a, b) => a.localeCompare(b));
    return sortedDates.map((dateStr) => {
      const sortedGroupTasks = [...map[dateStr]].sort((a, b) => {
        const timeA = getTaskEffectiveTime(a) || "99:99";
        const timeB = getTaskEffectiveTime(b) || "99:99";
        return timeA.localeCompare(timeB);
      });
      return {
        dateStr,
        tasks: sortedGroupTasks,
      };
    });
  }, [overdueDateTasks]);

  const sorted24hTasks = useMemo(() => {
    return [...dueWithin24hTasks].sort((a, b) => {
      const timeA = getTaskEffectiveTime(a) || "99:99";
      const timeB = getTaskEffectiveTime(b) || "99:99";
      return timeA.localeCompare(timeB);
    });
  }, [dueWithin24hTasks]);

  // Xử lý dời ngày thông minh (Quá 1 ngày dời sang mai; Quá >= 2 ngày chuyển thẳng vào Day View có sidebar chọn ngày, KHÔNG POPUP)
  const handleSmartReschedule = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const taskDateStr = getTaskEffectiveDate(task) || todayStr;
    const taskDateObj = new Date(taskDateStr);
    const todayDateObj = new Date(todayStr);
    const diffTime = todayDateObj.getTime() - taskDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // Trễ 1 ngày (hôm qua) hoặc hôm nay -> Dời sang ngày mai
      moveTaskToTomorrow(taskId);
    } else {
      // Trễ từ 2 ngày trở lên -> Chuyển thẳng sang Day View của ngày đó để chọn ngày dời trên Sidebar
      if (onNavigateToTaskDate) {
        onNavigateToTaskDate(taskDateStr, task.id);
      }
    }
  };

  // Click vào task -> Chuyển thẳng sang ngày của task đó
  const handleTaskClick = (task: TaskDto) => {
    const effectiveDate = getTaskEffectiveDate(task) || todayStr;
    if (onNavigateToTaskDate) {
      onNavigateToTaskDate(effectiveDate, task.id);
    }
  };

  return (
    <div className="space-y-4 w-full pb-16 select-none animate-in fade-in duration-150">
      {/* 1. Header & Segmented 3 Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626]">
        <div className="hidden">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#FECDD3] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <Hourglass size={13} className="text-rose-950" strokeWidth={2.4} />
            </div>
            <h2 className="font-bold text-sm sm:text-base text-[#1C1917]">
              Mốc hạn & Tiến độ công việc
            </h2>
          </div>
          <p className="text-[11px] text-[#78716C] mt-0.5">
            Phân loại rõ ràng quá hạn chót, quá ngày hẹn và các mốc hạn gấp trong 24h
          </p>
        </div>

        {/* 3 Sub-tabs Switch */}
        <div className="inline-flex p-1 bg-white border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] self-start sm:self-auto flex-wrap gap-1">
          {/* Sub-tab 1: Quá hạn chót */}
          <button
            type="button"
            onClick={() => setSubTab("overdue_deadline")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-bold transition-all ${
              subTab === "overdue_deadline"
                ? "bg-[#FECDD3] text-rose-950 border border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            } active:translate-y-[0.5px]`}
          >
            <AlertTriangle size={13} strokeWidth={subTab === "overdue_deadline" ? 2.6 : 2} className="text-rose-700" />
            <span>Quá hạn</span>
            {overdueDeadlineTasks.length > 0 && (
              <span className="font-mono text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full leading-none font-bold">
                {overdueDeadlineTasks.length}
              </span>
            )}
          </button>

          {/* Sub-tab 2: Quá ngày hẹn */}
          <button
            type="button"
            onClick={() => setSubTab("overdue_date")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-bold transition-all ${
              subTab === "overdue_date"
                ? "bg-[#FEF08A] text-amber-950 border border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            } active:translate-y-[0.5px]`}
          >
            <CalendarX size={13} strokeWidth={subTab === "overdue_date" ? 2.6 : 2} className="text-amber-800" />
            <span>Quá hẹn</span>
            {overdueDateTasks.length > 0 && (
              <span className="font-mono text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full leading-none font-bold">
                {overdueDateTasks.length}
              </span>
            )}
          </button>

          {/* Sub-tab 3: Đến hạn (24h) */}
          <button
            type="button"
            onClick={() => setSubTab("within_24h")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-bold transition-all ${
              subTab === "within_24h"
                ? "bg-[#BBF7D0] text-emerald-950 border border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            } active:translate-y-[0.5px]`}
          >
            <BellRing size={13} strokeWidth={subTab === "within_24h" ? 2.6 : 2} className="text-emerald-800" />
            <span>Đến hạn</span>
            {dueWithin24hTasks.length > 0 && (
              <span className="font-mono text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full leading-none font-bold">
                {dueWithin24hTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Banner Trạng Thái (Loại bỏ nút dời hàng loạt phi logic) */}
      {subTab === "overdue_deadline" && (
        overdueDeadlineTasks.length > 0 ? (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border-[1.5px] border-rose-300 rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] animate-in fade-in duration-150">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" strokeWidth={2.4} />
            <div>
              <p className="text-xs font-bold text-rose-950">
                Cảnh báo: Có {overdueDeadlineTasks.length} công việc đã quá giờ chót (deadline)!
              </p>
              <p className="text-[11px] text-rose-800">
                Hãy bấm vào từng công việc để chọn ngày thực hiện mới hoặc hoàn thành dứt điểm.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50/70 border-[1.5px] border-emerald-300 rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] animate-in fade-in duration-150">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-emerald-700" strokeWidth={2.4} />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1">
                <span>Tuyệt vời! Không có công việc nào bị quá hạn chót</span>
                <Sparkles size={14} className="text-amber-500" />
              </h4>
              <p className="text-[11px] text-emerald-800">
                Tất cả các deadline đều đang được xử lý rất tốt.
              </p>
            </div>
          </div>
        )
      )}

      {subTab === "overdue_date" && (
        overdueDateTasks.length > 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border-[1.5px] border-amber-300 rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] animate-in fade-in duration-150">
            <CalendarX size={18} className="text-amber-700 shrink-0" strokeWidth={2.4} />
            <div>
              <p className="text-xs font-bold text-amber-950">
                Có {overdueDateTasks.length} công việc từ những ngày trước chưa hoàn thành
              </p>
              <p className="text-[11px] text-amber-800">
                Hãy bấm vào công việc để xem lại bối cảnh và sắp xếp sang ngày mới phù hợp.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50/70 border-[1.5px] border-emerald-300 rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] animate-in fade-in duration-150">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-emerald-700" strokeWidth={2.4} />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1">
                <span>Không có công việc nào bị tồn đọng ngày cũ</span>
                <Sparkles size={14} className="text-amber-500" />
              </h4>
              <p className="text-[11px] text-emerald-800">
                Sổ tay của bạn rất sạch sẽ và ngăn nắp!
              </p>
            </div>
          </div>
        )
      )}

      {subTab === "within_24h" && (
        dueWithin24hTasks.length > 0 ? (
          <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-[6px] text-xs font-semibold text-emerald-950">
            <div className="flex items-center gap-1.5">
              <BellRing size={14} className="text-emerald-700" />
                <span>
                  Có {dueWithin24hTasks.length} công việc có mốc hạn trong vòng 24 giờ tới cần lưu ý
                </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50/70 border-[1.5px] border-emerald-300 rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] animate-in fade-in duration-150">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-emerald-700" strokeWidth={2.4} />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1">
                <span>Yên tâm! Không có mốc hạn gấp nào trong vòng 24h tới</span>
                <Sparkles size={14} className="text-amber-500" />
              </h4>
              <p className="text-[11px] text-emerald-800">
                Bạn có thể thong thả hoàn thành các công việc theo kế hoạch thường nhật.
              </p>
            </div>
          </div>
        )
      )}

      {/* 3. Danh Sách Công Việc Tương Ứng (Gom theo ngày cho Quá hạn chót & Quá ngày hẹn) */}
      <div className="pt-1">
        {subTab === "overdue_deadline" && (
          groupedOverdueDeadlines.length === 0 ? (
            <TaskList
              tasks={[]}
              emptyMessage="Không có công việc nào bị quá hạn chót"
              emptySubMessage="Mọi kế hoạch đều đang hoàn thành rất đúng giờ!"
              onToggle={toggleTask}
              onEdit={handleTaskClick}
              onDelete={deleteTask}
              onMoveTomorrow={handleSmartReschedule}
              onAddSubtask={handleTaskClick}
              onClick={handleTaskClick}
              variant="overdue"
              hideDate={false}
            />
          ) : (
            <div className="space-y-4">
              {groupedOverdueDeadlines.map((group) => (
                <div key={group.dateStr} className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-rose-600 shrink-0" strokeWidth={2.4} />
                      <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                        {formatFullDate(group.dateStr)} - {group.tasks.length} việc
                      </span>
                    </div>
                  </div>
                  <TaskList
                    tasks={group.tasks}
                    emptyMessage=""
                    emptySubMessage=""
                    onToggle={toggleTask}
                    onEdit={handleTaskClick}
                    onDelete={deleteTask}
                    onMoveTomorrow={handleSmartReschedule}
                    onAddSubtask={handleTaskClick}
                    onClick={handleTaskClick}
                    variant="overdue"
                    hideDate={true}
                    baseDateStr={group.dateStr}
                  />
                </div>
              ))}
            </div>
          )
        )}

        {subTab === "overdue_date" && (
          groupedOverdueDates.length === 0 ? (
            <TaskList
              tasks={[]}
              emptyMessage="Không có công việc nào bị quá ngày hẹn"
              emptySubMessage="Không có việc nào bị tồn đọng từ các ngày trước!"
              onToggle={toggleTask}
              onEdit={handleTaskClick}
              onDelete={deleteTask}
              onMoveTomorrow={handleSmartReschedule}
              onAddSubtask={handleTaskClick}
              onClick={handleTaskClick}
              variant="overdue"
              hideDate={false}
            />
          ) : (
            <div className="space-y-4">
              {groupedOverdueDates.map((group) => (
                <div key={group.dateStr} className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626]">
                    <div className="flex items-center gap-2">
                      <CalendarX size={14} className="text-amber-700 shrink-0" strokeWidth={2.4} />
                      <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                        {formatFullDate(group.dateStr)} - {group.tasks.length} việc
                      </span>
                    </div>
                  </div>
                  <TaskList
                    tasks={group.tasks}
                    emptyMessage=""
                    emptySubMessage=""
                    onToggle={toggleTask}
                    onEdit={handleTaskClick}
                    onDelete={deleteTask}
                    onMoveTomorrow={handleSmartReschedule}
                    onAddSubtask={handleTaskClick}
                    onClick={handleTaskClick}
                    variant="overdue"
                    hideDate={true}
                    baseDateStr={group.dateStr}
                  />
                </div>
              ))}
            </div>
          )
        )}

        {subTab === "within_24h" && (
          <TaskList
            tasks={sorted24hTasks}
            emptyMessage="Không có hạn chót nào trong 24 giờ tới"
            emptySubMessage="Thêm giờ chót khi tạo việc nếu bạn cần theo dõi sát sao mốc thời gian!"
            onToggle={toggleTask}
            onEdit={handleTaskClick}
            onDelete={deleteTask}
            onMoveTomorrow={handleSmartReschedule}
            onAddSubtask={handleTaskClick}
            onClick={handleTaskClick}
            variant="planner"
            hideDate={false}
          />
        )}
      </div>
    </div>
  );
};
