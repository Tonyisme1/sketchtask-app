import React, { useMemo } from "react";
import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { JournalEntryDto, TaskDto, TabKey } from "../../../types";
import { getLocalTodayStr, formatShortDayMonth } from "../../../utils/date";

interface DashboardRecentJournalProps {
  journalEntries: JournalEntryDto[];
  tasks: TaskDto[];
  onNavigateTab?: (tab: TabKey) => void;
  onSelectNoteSubTab?: (subTab: "notes" | "journal") => void;
}

// Helper bỏ thẻ HTML trong nội dung nhật ký
const stripHtml = (html: string): string => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

export const DashboardRecentJournal: React.FC<DashboardRecentJournalProps> = ({
  journalEntries,
  tasks,
  onNavigateTab,
  onSelectNoteSubTab,
}) => {
  const todayStr = getLocalTodayStr();

  // Lấy tối đa 3 dòng nhật ký gần nhất
  const recentEntries = useMemo(() => {
    const sorted = [...journalEntries].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.time.localeCompare(a.time);
    });
    return sorted.slice(0, 3);
  }, [journalEntries]);

  const handleGoToJournal = () => {
    if (onNavigateTab) {
      onNavigateTab("journal");
    }
  };

  return (
    <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] select-none space-y-3">
      {/* Header Nhật ký gần đây */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
        <div className="flex items-center gap-1.5">
          <BookOpen size={15} className="text-purple-900" strokeWidth={2.4} />
          <h2 className="text-xs sm:text-sm font-bold text-[#1C1917] uppercase tracking-wider font-mono">
            Nhật Ký Gần Đây
          </h2>
        </div>

        <button
          type="button"
          onClick={handleGoToJournal}
          className="text-[11px] font-bold text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
        >
          <span>Mở sổ</span>
          <ArrowRight size={12} strokeWidth={2.4} />
        </button>
      </div>

      {/* Danh sách 3 entry gần nhất */}
      {recentEntries.length === 0 ? (
        /* Empty State */
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF8F3] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
            <BookOpen size={14} className="text-[#78716C]" />
          </div>
          <p className="text-xs font-bold text-[#78716C]">
            Chưa có dòng ghi chép nhật ký nào
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentEntries.map((entry) => {
            const isToday = entry.date === todayStr;
            const dateLabel = isToday ? "Hôm nay" : formatShortDayMonth(entry.date);
            const plainText = stripHtml(entry.content);
            const linkedTask = entry.linkedTaskId
              ? tasks.find((t) => t.id === entry.linkedTaskId)
              : null;

            return (
              <div
                key={entry.id}
                onClick={handleGoToJournal}
                className="p-2 sm:p-2.5 bg-[#FAF8F3] hover:bg-[#F5F2EA] border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] cursor-pointer transition-all active:translate-y-[0.5px]"
              >
                {/* Hàng trên: Mốc thời gian & task liên kết */}
                <div className="flex items-center justify-between gap-1.5 pb-1 text-[10px] font-mono text-[#78716C]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#1C1917] bg-white px-1.5 py-0.2 border border-[#262626] rounded-[2px] shadow-[0.5px_0.5px_0px_#262626]">
                      {dateLabel} {entry.time}
                    </span>
                  </div>

                  {linkedTask && (
                    <span className="px-1.5 py-0.2 rounded-[3px] bg-[#BBF7D0] border border-[#262626] text-[9px] font-bold text-emerald-950 flex items-center gap-0.5 truncate max-w-[120px]">
                      <CheckCircle2 size={9} strokeWidth={2.4} />
                      <span className="truncate">{linkedTask.title}</span>
                    </span>
                  )}
                </div>

                {/* Hàng dưới: Nội dung trích xuất */}
                <p className="text-xs text-[#1C1917] line-clamp-2 leading-relaxed font-sans pt-0.5">
                  {plainText || <span className="italic text-[#A8A29E]">(Không có nội dung)</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
