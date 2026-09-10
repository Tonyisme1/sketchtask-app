import React from "react";
import { NotebookDto, TaskDto } from "../../../types";
import { DynamicIcon, EmptyStateDoodle } from "../../ui";
import { getCardTilt } from "../../../utils/tilt";
import { getContextualColorPalette } from "../../../utils/colorContrast";
import {
  Trash2,
  ArrowRight,
  CheckSquare,
} from "lucide-react";

export interface NotebookListProps {
  notebooks: NotebookDto[];
  tasks: TaskDto[];
  onSelectNotebook: (id: string) => void;
  onRequestDeleteNotebook: (id: string, e: React.MouseEvent) => void;
  isTiltEnabled: boolean;
}

export const NotebookList: React.FC<NotebookListProps> = ({
  notebooks,
  tasks,
  onSelectNotebook,
  onRequestDeleteNotebook,
  isTiltEnabled,
}) => {
  if (notebooks.length === 0) {
    return (
      <div className="col-span-full py-8">
        <EmptyStateDoodle
          title="Chưa có cuốn sổ nào"
          message="Hãy tạo cuốn sổ đầu tiên để phân loại công việc theo từng chủ đề riêng biệt!"
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

        const tiltDeg = isTiltEnabled ? getCardTilt(index) : 0;
        const backgroundColor = nb.color || "#FAF8F3";
        const textPalette = getContextualColorPalette(backgroundColor);

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
              backgroundColor,
              color: textPalette.primary,
              transform: tiltDeg !== 0 ? `rotate(${tiltDeg}deg)` : undefined,
            }}
            className="group relative p-4 border-[1.5px] border-[#262626] rounded-[8px] shadow-[2.5px_2.5px_0px_#262626] transition-all hover:shadow-[4px_4px_0px_#262626] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#262626] focus:ring-offset-2 cursor-pointer flex flex-col justify-between min-h-[180px] active:translate-y-0"
          >
            <div className="space-y-2.5">
              {/* Header Card Sổ: Icon & Nút thao tác */}
              <div className="flex items-start justify-between gap-1">
                <span
                  style={{
                    backgroundColor: textPalette.controlSurface,
                    borderColor: textPalette.controlSurface,
                    color: textPalette.controlText,
                  }}
                  className="w-9 h-9 rounded-[4px] border-[1.5px] flex items-center justify-center shadow-[1px_1px_0px_#262626] shrink-0"
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
                    style={{
                      backgroundColor: textPalette.surface,
                      borderColor: textPalette.border,
                      color: textPalette.primary,
                    }}
                    className="w-8 h-8 p-1 hover:bg-rose-50 border rounded-[4px] hover:text-rose-700 active:translate-y-[0.5px] flex items-center justify-center cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* Tên & Mô tả Sổ */}
              <div>
                <h3
                  style={{ color: textPalette.primary }}
                  className="font-black text-base sm:text-lg leading-snug line-clamp-1 tracking-tight"
                >
                  {nb.name}
                </h3>
                <p
                  style={{ color: textPalette.secondary }}
                  className="text-xs line-clamp-2 mt-0.5 min-h-[32px] font-medium leading-relaxed"
                >
                  {nb.description || "Chưa có mô tả cho cuốn sổ này..."}
                </p>
              </div>

              {/* Hàng đếm công việc */}
              <div
                style={{ color: textPalette.primary }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold flex-wrap"
              >
                <span
                  style={{
                    backgroundColor: textPalette.surface,
                    borderColor: textPalette.border,
                    color: textPalette.primary,
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border shadow-[0.5px_0.5px_0px_#262626]"
                >
                  <CheckSquare size={12} />
                  {totalNbTasks} việc
                </span>
              </div>
            </div>

            {/* Footer Card Sổ: Tiến độ & Nút Mở */}
            <div
              style={{ borderColor: textPalette.border }}
              className="pt-2.5 border-t space-y-1.5"
            >
              <div
                style={{ color: textPalette.primary }}
                className="flex items-center justify-between text-xs font-mono font-bold"
              >
                <span>Tiến độ:</span>
                <span>
                  {completedNbTasks}/{totalNbTasks} ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar Nét Mực */}
              <div
                style={{
                  backgroundColor: textPalette.track,
                  borderColor: textPalette.border,
                }}
                className="w-full h-1.5 border rounded-[2px] overflow-hidden"
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: textPalette.primary,
                  }}
                  className="h-full transition-all duration-300"
                />
              </div>

              <div
                style={{ color: textPalette.primary }}
                className="flex items-center justify-end text-xs font-bold pt-0.5 group-hover:translate-x-0.5 transition-transform min-h-[24px]"
              >
                <span
                  style={{
                    backgroundColor: textPalette.surface,
                    borderColor: textPalette.border,
                    color: textPalette.primary,
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded border"
                >
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
