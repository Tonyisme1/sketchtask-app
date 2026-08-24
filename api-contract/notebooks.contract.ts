// ==========================================
// API CONTRACT: NOTEBOOKS & PROJECTS
// ==========================================

export type NotebookColor = "yellow" | "coral" | "mint" | "sky" | "lavender";

export interface NotebookDto {
  id: string;
  name: string;
  description?: string;
  color: NotebookColor;
  icon?: string;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotebookRequest {
  name: string;
  description?: string;
  color?: NotebookColor;
  icon?: string;
}

export interface UpdateNotebookRequest {
  name?: string;
  description?: string;
  color?: NotebookColor;
  icon?: string;
}

