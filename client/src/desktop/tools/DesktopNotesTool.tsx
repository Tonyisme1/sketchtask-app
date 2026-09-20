import React from "react";
import { Plus, Search } from "lucide-react";
import { NoteMasterDetailView } from "../../components/shared/notes/NoteMasterDetailView";
import { useNotesScreenModel } from "../../features/notes/model/createNotesScreenModel";

// === PHẦN 1: ỨNG DỤNG GHI CHÚ THU GỌN TRONG RIGHT DOCK ===
export const DesktopNotesTool: React.FC = () => {
  const model = useNotesScreenModel();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 p-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[var(--bg-surface-muted)] px-3.5 py-1 text-[var(--text-muted)] focus-within:ring-2 focus-within:ring-[var(--accent-blue)]/30">
          <Search size={15} strokeWidth={2.2} />
          <input
            value={model.searchQuery}
            onChange={(event) => model.actions.setSearchQuery(event.target.value)}
            placeholder="Tìm ghi chú..."
            className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[var(--text-main)] outline-none placeholder:text-[var(--text-subtle)]"
          />
        </label>
        <button
          type="button"
          onClick={model.actions.createNote}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--text-strong)] px-3 text-xs font-bold text-[var(--bg-surface)] transition-opacity hover:opacity-85 active:scale-95 cursor-pointer shadow-xs"
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Thêm</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <NoteMasterDetailView
          notes={model.filteredNotes}
          newlyCreatedId={model.activeNote?.id}
          onUpdateNote={model.actions.updateNote}
          onDeleteNote={model.actions.deleteNote}
          onTogglePinNote={model.actions.togglePinNote}
          onCreateClick={model.actions.createNote}
          isMobile={false}
          isMobileNoteDetailOpen={true}
          onMobileDetailOpenChange={model.actions.setEditorOpen}
        />
      </div>
    </div>
  );
};
