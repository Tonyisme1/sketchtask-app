import React, { useState } from "react";
import { Search, X, AlertTriangle } from "lucide-react";
import { NoteMasterDetailView } from "../../components/shared/notes/NoteMasterDetailView";
import { NavigationTarget, TabKey } from "../../types";
import {
  NotesScreenModel,
  useNotesScreenModel,
} from "../../features/notes/model/createNotesScreenModel";

export interface TabletNotesPageProps {
  model?: NotesScreenModel;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const TabletNotesPage: React.FC<TabletNotesPageProps> = ({
  model: propModel,
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const defaultModel = useNotesScreenModel({
    initialNoteId: navigationTarget?.noteId,
    onClearTarget: onClearNavigationTarget,
  });
  const model = propModel || defaultModel;

  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);

  const displayNotes = showNeedsReviewOnly
    ? model.filteredNotes.filter((n) => !n.title.trim() || n.title.trim().toLowerCase() === "ghi chú không tiêu đề")
    : model.filteredNotes;

  return (
    <div className="w-full min-w-0 select-none space-y-3.5 pb-12 animate-in fade-in duration-150">
      <div className="flex items-center gap-2.5 border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border-none bg-white dark:bg-[#1C1C20] px-3.5 shadow-xs">
          <Search size={14} strokeWidth={2.4} className="shrink-0 text-[#78716C] dark:text-[#A1A1AA]" />
          <input
            type="text"
            value={model.searchQuery}
            onChange={(event) => model.actions.setSearchQuery(event.target.value)}
            placeholder="Tìm ghi chú..."
            className="w-full bg-transparent py-2 pl-1 text-xs text-[#1C1917] dark:text-[#ECECF1] placeholder:text-[#A8A29E] dark:placeholder:text-[#71717A] focus:outline-none sm:text-sm"
          />
          {model.searchQuery && (
            <button
              type="button"
              onClick={() => model.actions.setSearchQuery("")}
              className="shrink-0 text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917] dark:hover:text-[#ECECF1] cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X size={13} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {model.needsReviewCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border-none bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 text-xs shadow-2xs">
          <div className="flex min-w-0 items-start gap-2 text-[#57534E] dark:text-[#A1A1AA]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#9F1239] dark:text-[#FDA4AF]" strokeWidth={2.2} />
            <p className="leading-relaxed">
              Có {model.needsReviewCount} note chưa có tiêu đề rõ ràng hoặc chưa có nội dung.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNeedsReviewOnly((current) => !current)}
            className="shrink-0 rounded-xl border-none bg-white dark:bg-[#2C2C2E] px-3 py-1.5 text-[11px] font-semibold text-[#1C1917] dark:text-[#F2F2F7] shadow-xs active:scale-95 cursor-pointer transition-all"
          >
            {showNeedsReviewOnly ? "Hiện tất cả" : "Xem note cần dọn"}
          </button>
        </div>
      )}

      <div className="pt-0.5">
        <NoteMasterDetailView
          notes={displayNotes}
          initialNoteId={navigationTarget?.noteId}
          onUpdateNote={model.actions.updateNote}
          onDeleteNote={model.actions.deleteNote}
          onTogglePinNote={model.actions.togglePinNote}
          onCreateClick={model.actions.createNote}
          isMobile={model.isMobile}
          isMobileNoteDetailOpen={model.isEditorOpen}
          onMobileDetailOpenChange={model.actions.setEditorOpen}
        />
      </div>
    </div>
  );
};
