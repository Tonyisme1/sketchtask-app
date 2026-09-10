import React, { useMemo } from "react";
import { BookOpen, ArrowRight, FolderKanban, CheckCircle2 } from "lucide-react";
import { NotebookDto, TaskDto, TabKey } from "../../../types";
import { DynamicIcon } from "../../ui";

interface DashboardNotebooksGlanceProps {
  notebooks: NotebookDto[];
  tasks: TaskDto[];
  onNavigateTab?: (tab: TabKey) => void;
}

export const DashboardNotebooksGlance: React.FC<DashboardNotebooksGlanceProps> = ({
  notebooks,
  tasks,
  onNavigateTab,
}) => {
  // Lấy danh sách 4 sổ tay đầu tiên kèm số lượng task chưa xong
  const topNotebooks = useMemo(() => {
    return notebooks.slice(0, 4).map((nb) => {
      const nbTasks = tasks.filter((t) => t.notebookId === nb.id);
      const pendingTasks = nbTasks.filter((t) => !t.completed).length;
      return {
        ...nb,
        pendingCount: pendingTasks,
        totalCount: nbTasks.length,
      };
    });
  }, [notebooks, tasks]);

  const handleGoToNotebooks = () => {
    if (onNavigateTab) {
      onNavigateTab("notebooks");
    }
  };

  return (
    <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] select-none space-y-3">
      {/* Header Sổ tay & Dự án */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
        <div className="flex items-center gap-1.5">
          <FolderKanban size={15} className="text-[#1C1917]" strokeWidth={2.4} />
          <h2 className="text-xs sm:text-sm font-bold text-[#1C1917] uppercase tracking-wider font-mono">
            Sổ Tay & Dự Án
          </h2>
        </div>

        <button
          type="button"
          onClick={handleGoToNotebooks}
          className="text-[11px] font-bold text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
        >
          <span>Xem tất cả ({notebooks.length})</span>
          <ArrowRight size={12} strokeWidth={2.4} />
        </button>
      </div>

      {/* Danh sách sổ tay */}
      {topNotebooks.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-1.5 text-[#78716C]">
          <p className="text-xs font-bold text-[#1C1917]">
            Chưa có sổ tay nào
          </p>
          <p className="text-[11px]">
            Tạo sổ tay để gom nhóm công việc và ghi chép theo từng dự án.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {topNotebooks.map((nb) => (
            <div
              key={nb.id}
              onClick={handleGoToNotebooks}
              className="p-2.5 bg-[#FAF8F3] hover:bg-[#F5F2EA] border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex flex-col justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-[#262626] flex items-center justify-center shrink-0 shadow-[0.5px_0.5px_0px_#262626] bg-[#FAF8F3]"
                >
                  <DynamicIcon name={nb.icon || "lucide:BookOpen"} size={13} strokeWidth={2.2} />
                </div>
                <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">
                  {nb.name}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-[#78716C]">
                <span>{nb.pendingCount} việc chờ</span>
                {nb.pendingCount === 0 && nb.totalCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[#1C1917] font-bold">
                    <CheckCircle2 size={11} strokeWidth={2.4} />
                    Xong
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
