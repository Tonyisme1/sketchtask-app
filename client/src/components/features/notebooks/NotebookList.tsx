import React from "react";
import { NotebookDto, TaskDto, JournalEntryDto } from "../../../types";
import { NoteItem } from "../notes/NoteTypes";
import { DynamicIcon, EmptyStateDoodle } from "../../ui";
import { getCardTilt } from "../../../utils/tilt";
import {
  Trash2,
  ArrowRight,
  CheckSquare,
  FileText,
  BookOpen,
} from "lucide-react";

export interface NotebookListProps {
  notebooks: NotebookDto[];
  tasks: TaskDto[];
  notes?: NoteItem[];
  journalEntries?: JournalEntryDto[];
  onSelectNotebook: (id: string) => void;
  onRequestDeleteNotebook: (id: string, e: React.MouseEvent) => void;
  isTiltEnabled: boolean;
}

export const NotebookList: React.FC<NotebookListProps> = ({
  notebooks,
  tasks,
  notes = [],
  journalEntries = [],
  onSelectNotebook,
  onRequestDeleteNotebook,
  isTiltEnabled,
}) => {
  if (notebooks.length === 0) {
    return (
      <div className="col-span-full py-8">
        <EmptyStateDoodle
          title="Chưa có cuốn sổ nào"
          message="Hãy tạo cuốn sổ đầu tiên để phân loại công việc, ghi chú và nhật ký theo từng chủ đề riêng biệt!"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 select-none">
      {notebooks.map((nb, index) => {
        const nbTasks = tasks.filter((t) => t.notebookId === nb.id);
        const completedNbTasks = nbTasks.filter((t) => t.completed).length;
        const totalNbTasks = nbTasks.length;
        const progressPercent =
          totalNbTasks > 0
            ? Math.round((completedNbTasks / totalNbTasks) * 100)
            : 0;

        const nbNotes = notes.filter((n) => n.notebookId === nb.id);
        const nbJournals = journalEntries.filter((j) => j.notebookId === nb.id);

        const tiltDeg = isTiltEnabled ? getCardTilt(index) : 0;

        return (
          <div
            key={nb.id}
            role="button"
            tabIndex={0}
            aria-label={`Mở cuốn sổ ${nb.name}`}
            onClick={() => onSelectNotebook(nb.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectNotebook(nb.id);
              }
            }}
            style={{
              backgroundColor: nb.color || "#FAF8F3",
              transform: tiltDeg !== 0 ? `rotate(${tiltDeg}deg)` : undefined,
            }}
            className="group relative p-4 border-[1.5px] border-[#262626] rounded-[8px] shadow-[2.5px_2.5px_0px_#262626] transition-all hover:shadow-[4px_4px_0px_#262626] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#262626] focus:ring-offset-2 cursor-pointer flex flex-col justify-between min-h-[180px] active:translate-y-0"
          >
            <div className="space-y-2.5">
              {/* Header Card Sổ: Icon & Nút thao tác */}
              <div className="flex items-start justify-between gap-1">
                <span
                  className="w-9 h-9 rounded-[4px] border-[1.5px] border-[#262626] bg-white flex items-center justify-center shadow-[1px_1px_0px_#262626] shrink-0"
                >
                  <DynamicIcon
                    name={nb.icon || "lucide:BookMarked"}
                    size={20}
                    strokeWidth={2.2}
                  />
                </span>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    aria-label={`Xóa sổ ${nb.name}`}
                    onClick={(e) => onRequestDeleteNotebook(nb.id, e)}
                    title="Xóa cuốn sổ"
                    className="w-8 h-8 p-1 bg-white hover:bg-rose-50 border border-[#262626] rounded-[4px] text-[#1C1917] hover:text-rose-700 active:translate-y-[0.5px] flex items-center justify-center cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* Tên & Mô tả Sổ */}
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#1C1917] leading-snug line-clamp-1 tracking-tight">
                  {nb.name}
                </h3>
                <p className="text-xs text-[#262626]/80 line-clamp-2 mt-0.5 min-h-[32px] font-medium leading-relaxed">
                  {nb.description || "Chưa có mô tả cho cuốn sổ này..."}
                </p>
              </div>

              {/* Hàng đếm Note & Journal & Task */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1C1917] flex-wrap">
                <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-[4px] border border-[#262626]/40 shadow-[0.5px_0.5px_0px_#262626]">
                  <CheckSquare size={12} className="text-[#1C1917]" />
                  {totalNbTasks} việc
                </span>
                <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-[4px] border border-[#262626]/40 shadow-[0.5px_0.5px_0px_#262626]">
                  <FileText size={12} className="text-[#1C1917]" />
                  {nbNotes.length} note
                </span>
                {nbJournals.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-[4px] border border-[#262626]/40 shadow-[0.5px_0.5px_0px_#262626]">
                    <BookOpen size={12} className="text-[#1C1917]" />
                    {nbJournals.length} nhật ký
                  </span>
                )}
              </div>
            </div>

            {/* Footer Card Sổ: Tiến độ & Nút Mở */}
            <div className="pt-2.5 border-t border-[#262626]/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1C1917]">
                <span>Tiến độ:</span>
                <span>
                  {completedNbTasks}/{totalNbTasks} ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar Nét Mực */}
              <div className="w-full h-1.5 bg-white/80 border border-[#262626] rounded-[2px] overflow-hidden">
                <div
                  className="h-full bg-[#262626] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-end text-xs font-bold text-[#1C1917] pt-0.5 group-hover:translate-x-0.5 transition-transform min-h-[24px]">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1C1917] bg-white/80 px-2.5 py-0.5 rounded border border-[#262626]/30">
                  Mở sổ <ArrowRight size={12} strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
