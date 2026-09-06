// ==========================================
// TYPES: Note Workspace (Ghi chú cơ bản)
// ==========================================

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  notebookId?: string;
  createdAt: string;
  updatedAt: string;
}
