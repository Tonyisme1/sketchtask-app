import { NoteItem } from "../components/features/notes/NoteTypes";

const NOTES_STORAGE_KEY = "sketchtask_notes_v1";

const INITIAL_NOTES: NoteItem[] = [
  {
    id: "note-init-1",
    title: "Kiến trúc Giao diện Sổ tay Bản thảo",
    content:
      "<p>Đảm bảo toàn bộ layout sử dụng viền nét mực <strong>1.5px</strong>, hard shadow <em>2px 2px 0px #262626</em> và màu sắc trích xuất từ bảng màu token chuẩn.</p><p>Hỗ trợ đầy đủ tương tác xúc giác trên cả Desktop và Mobile.</p>",
    notebookId: "nb-1",
    createdAt: "09:00, 04/09/2026",
    updatedAt: "09:00, 04/09/2026",
  },
  {
    id: "note-init-2",
    title: "Tối ưu hóa IndexedDB & Delta Sync",
    content:
      "<p>Ghi chép về cơ chế lưu trữ Offline-First:</p><ul><li>Đồng bộ 2 chiều qua WebSocket realtime</li><li>Smart merge dữ liệu khi có xung đột</li><li>Tự động retry khi mạng chập chờn</li></ul>",
    notebookId: "nb-2",
    createdAt: "10:30, 04/09/2026",
    updatedAt: "10:30, 04/09/2026",
  },
  {
    id: "note-init-3",
    title: "Mục tiêu sức khỏe & Thể lực tuần này",
    content:
      "<p>1. Uống đủ 2L nước mỗi ngày<br/>2. Chạy bộ 3 buổi / tuần (tối thiểu 5km)<br/>3. Ngủ trước 23:00</p>",
    notebookId: "nb-3",
    createdAt: "08:15, 03/09/2026",
    updatedAt: "08:15, 03/09/2026",
  },
];

/**
 * Load danh sách ghi chú an toàn từ localStorage.
 * Kiểm tra đầy đủ id, title, content, createdAt, updatedAt.
 * Nếu dữ liệu rỗng, hỏng hoặc sai định dạng/thiếu trường thì trả về dữ liệu mẫu hoặc mảng rỗng an toàn.
 */
export const loadNotesFromStorage = (): NoteItem[] => {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return INITIAL_NOTES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_NOTES;

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

    return validNotes.length > 0 ? validNotes : INITIAL_NOTES;
  } catch (error) {
    console.warn("Lỗi khi đọc danh sách ghi chú từ localStorage:", error);
    return INITIAL_NOTES;
  }
};

/**
 * Lưu danh sách ghi chú vào localStorage an toàn.
 */
export const saveNotesToStorage = (notes: NoteItem[]): void => {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent("sketchtask_notes_changed"));
  } catch (error) {
    console.warn("Lỗi khi lưu danh sách ghi chú vào localStorage:", error);
  }
};
