import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { NoteMasterDetailView } from "../../components/shared/notes/NoteMasterDetailView";
import { NavigationTarget, TabKey } from "../../types";
import {
  NotesScreenModel,
  useNotesScreenModel,
} from "../../features/notes/model/createNotesScreenModel";

export interface MobileNotesPageProps {
  model?: NotesScreenModel;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const MobileNotesPage: React.FC<MobileNotesPageProps> = ({
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
  const isMobileEditorOpen = model.isEditorOpen;

  const displayNotes = showNeedsReviewOnly
    ? model.filteredNotes.filter((n) => !n.title.trim() || n.title.trim().toLowerCase() === "ghi chú không tiêu đề")
    : model.filteredNotes;

  return (
    <div className={`w-full min-w-0 select-none ${isMobileEditorOpen ? "p-0" : "space-y-3.5 pb-12"}`}>
      {model.needsReviewCount > 0 && !isMobileEditorOpen && (
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

      <div className={isMobileEditorOpen ? "p-0" : "pt-0.5"}>
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
