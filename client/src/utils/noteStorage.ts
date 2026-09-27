import type { NoteItem } from "../components/shared/notes/NoteTypes";

export const LEGACY_NOTES_STORAGE_KEY = "sketchtask_notes_v1";

/** Read only real legacy notes. Runtime no longer injects example data. */
export const loadLegacyNotesForMigration = (): NoteItem[] => {
  try {
    const raw = localStorage.getItem(LEGACY_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Lọc và chuẩn hóa từng item đảm bảo chặt chẽ đúng schema NoteItem
    const validNotes = parsed.filter(
      (item): item is NoteItem =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        item.id.trim().length > 0 &&
        typeof item.title === "string" &&
        typeof item.content === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string"
    );

    return validNotes.map((note) => ({ ...note, isPinned: Boolean(note.isPinned) }));
  } catch (error) {
    console.warn("Lỗi khi đọc danh sách ghi chú từ localStorage:", error);
    return [];
  }
};

/** Mark the old local-only collection as migrated after it enters sync storage. */
export const clearLegacyNotesAfterMigration = (): void => {
  try {
    localStorage.removeItem(LEGACY_NOTES_STORAGE_KEY);
  } catch (error) {
    console.warn("Lỗi khi hoàn tất migration ghi chú cũ:", error);
  }
};
