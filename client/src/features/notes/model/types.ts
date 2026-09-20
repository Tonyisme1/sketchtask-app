import { NoteItem } from "../../../components/shared/notes/NoteTypes";

export interface NotesScreenModel {
  notes: NoteItem[];
  filteredNotes: NoteItem[];
  searchQuery: string;
  activeNote: NoteItem | null;
  needsReviewCount: number;
  isEditorOpen: boolean;
  isMobile: boolean;

  actions: {
    setSearchQuery: (query: string) => void;
    selectNote: (id: string | undefined) => void;
    createNote: () => string;
    updateNote: (note: NoteItem) => void;
    deleteNote: (id: string) => void;
    togglePinNote: (id: string) => void;
    closeEditor: () => void;
    setEditorOpen: (open: boolean) => void;
  };
}
