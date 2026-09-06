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
  Edit2,
} from "lucide-react";

export interface NotebookListProps {
  notebooks: NotebookDto[];
  tasks: TaskDto[];
  notes?: NoteItem[];
  journalEntries?: JournalEntryDto[];
  onSelectNotebook: (id: string) => void;
  onRequestDeleteNotebook: (id: string, e: React.MouseEvent) => void;
  onEditNotebook?: (notebook: NotebookDto, e: React.MouseEvent) => void;
  isTiltEnabled: boolean;
}

export const NotebookList: React.FC<NotebookListProps> = ({
  notebooks,
  tasks,
  notes = [],
  journalEntries = [],
  onSelectNotebook,
  onRequestDeleteNotebook,
  onEditNotebook,
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
              backgroundColor: nb.color || "#FEF08A",
              transform: tiltDeg !== 0 ? `rotate(${tiltDeg}deg)` : undefined,
            }}
            className="group relative p-3.5 border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] transition-all hover:shadow-[3.5px_3.5px_0px_#262626] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#262626] focus:ring-offset-2 cursor-pointer flex flex-col justify-between min-h-[165px] active:translate-y-0"
          >
            <div className="space-y-2">
              {/* Header Card Sổ: Icon & Nút thao tác */}
              <div className="flex items-start justify-between gap-1">
                <span
                  className="w-8 h-8 rounded border border-[#262626] bg-white flex items-center justify-center shadow-[1px_1px_0px_#262626] shrink-0"
                >
                  <DynamicIcon
                    name={nb.icon || "lucide:BookMarked"}
                    size={18}
                    strokeWidth={2.2}
                  />
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  {onEditNotebook && (
                    <button
                      type="button"
                      aria-label={`Chỉnh sửa sổ ${nb.name}`}
                      onClick={(e) => onEditNotebook(nb, e)}
                      title="Chỉnh sửa thông tin sổ"
                      className="min-w-[28px] min-h-[28px] p-1 bg-white hover:bg-[#FAF8F3] border border-[#262626] rounded text-[#1C1917] active:translate-y-[0.5px] flex items-center justify-center cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
                    >
                      <Edit2 size={12} strokeWidth={2.2} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Xóa sổ ${nb.name}`}
                    onClick={(e) => onRequestDeleteNotebook(nb.id, e)}
                    title="Xóa cuốn sổ"
                    className="min-w-[28px] min-h-[28px] p-1 bg-white hover:bg-rose-50 border border-[#262626] rounded text-[#1C1917] hover:text-rose-600 active:translate-y-[0.5px] flex items-center justify-center cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
                  >
                    <Trash2 size={12} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* Tên & Mô tả Sổ */}
              <div>
                <h3 className="font-black text-sm sm:text-base text-[#1C1917] leading-snug line-clamp-1 tracking-tight">
                  {nb.name}
                </h3>
                <p className="text-[11px] text-[#262626]/80 line-clamp-2 mt-0.5 min-h-[28px] font-medium leading-relaxed">
                  {nb.description || "Chưa có mô tả cho cuốn sổ này..."}
                </p>
              </div>

              {/* Hàng đếm Note & Journal & Task */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1C1917] flex-wrap">
                <span className="inline-flex items-center gap-0.5 bg-white/90 px-1.5 py-0.5 rounded border border-[#262626]/40 shadow-[0.5px_0.5px_0px_#262626]">
                  <CheckSquare size={10} className="text-[#1C1917]" />
                  {totalNbTasks} việc
                </span>
                <span className="inline-flex items-center gap-0.5 bg-white/90 px-1.5 py-0.5 rounded border border-[#262626]/40 shadow-[0.5px_0.5px_0px_#262626]">
                  <FileText size={10} className="text-[#1C1917]" />
                  {nbNotes.length} note
                </span>
                {nbJournals.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 bg-white/90 px-1.5 py-0.5 rounded border border-[#262626]/40 shadow-[0.5px_0.5px_0px_#262626]">
                    <BookOpen size={10} className="text-[#1C1917]" />
                    {nbJournals.length} nhật ký
                  </span>
                )}
              </div>
            </div>

            {/* Footer Card Sổ: Tiến độ & Nút Mở */}
            <div className="pt-2 border-t border-[#262626]/20 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#1C1917]">
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
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1C1917] bg-white/80 px-2 py-0.5 rounded border border-[#262626]/30">
                  Mở sổ <ArrowRight size={11} strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
