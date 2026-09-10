// ==========================================
// TYPES: Note Workspace (Ghi chú cơ bản)
// ==========================================

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  notebookId?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}
