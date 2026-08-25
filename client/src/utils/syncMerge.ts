import { TaskDto, NotebookDto, HabitDto, TaskStatus } from "../types";
import { StickyNoteItem } from "../stores/appStore";

// ==========================================
// UTILS: Smart Merge Engine (Giải quyết xung đột Offline-First & Đăng nhập)
// ==========================================

export interface RawSyncData {
  tasks: TaskDto[];
  notebooks: NotebookDto[];
  stickyNotes: StickyNoteItem[];
  habits: HabitDto[];
  dailyMoods: Record<string, string>;
  weeklyReflection: string;
  tags: string[];
}

/**
 * Hợp nhất thông minh danh sách Task giữa Local và Remote theo ID và Timestamp (Last-Write-Wins)
 */
export function mergeTasks(localTasks: TaskDto[], remoteTasks: TaskDto[]): TaskDto[] {
  const map = new Map<string, TaskDto>();

  // 1. Nạp dữ liệu Remote
  for (const rTask of remoteTasks) {
    map.set(rTask.id, rTask);
  }

  // 2. Hợp nhất dữ liệu Local (Không bao giờ xóa mất task tạo lúc offline)
  for (const lTask of localTasks) {
    const existing = map.get(lTask.id);
    if (!existing) {
      // Task này mới tạo ở Local -> Giữ lại!
      map.set(lTask.id, lTask);
    } else {
      // Trùng ID -> So sánh thời gian cập nhật gần nhất
      const lTime = new Date(lTask.updatedAt || lTask.createdAt || 0).getTime();
      const rTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (lTime > rTime) {
        map.set(lTask.id, lTask);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Hợp nhất danh sách Sổ tay (Notebooks)
 */
export function mergeNotebooks(localNbs: NotebookDto[], remoteNbs: NotebookDto[]): NotebookDto[] {
  const map = new Map<string, NotebookDto>();

  for (const rNb of remoteNbs) {
    map.set(rNb.id, rNb);
  }

  for (const lNb of localNbs) {
    const existing = map.get(lNb.id);
    if (!existing) {
      // Kiểm tra theo tên sổ tay để tránh tạo 2 sổ trùng tên
      const sameName = Array.from(map.values()).find((n) => n.name.trim().toLowerCase() === lNb.name.trim().toLowerCase());
      if (!sameName) {
        map.set(lNb.id, lNb);
      }
    } else {
      const lTime = new Date(lNb.updatedAt || lNb.createdAt || 0).getTime();
      const rTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (lTime > rTime) {
        map.set(lNb.id, lNb);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Hợp nhất Sticky Notes
 */
export function mergeStickyNotes(localNotes: StickyNoteItem[], remoteNotes: StickyNoteItem[]): StickyNoteItem[] {
  const map = new Map<string, StickyNoteItem>();

  for (const rNote of remoteNotes) {
    map.set(rNote.id, rNote);
  }

  for (const lNote of localNotes) {
    if (!map.has(lNote.id)) {
      map.set(lNote.id, lNote);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Hợp nhất Thói quen (Habits) & gộp tất cả các ngày đã hoàn thành (Union of Completed Dates)
 */
export function mergeHabits(localHabits: HabitDto[], remoteHabits: HabitDto[]): HabitDto[] {
  const map = new Map<string, HabitDto>();

  for (const rHabit of remoteHabits) {
    map.set(rHabit.id, rHabit);
  }

  for (const lHabit of localHabits) {
    const existing = map.get(lHabit.id);
    if (!existing) {
      map.set(lHabit.id, lHabit);
    } else {
      // Gộp các ngày đã tick hoàn thành giữa 2 thiết bị
      const combinedDates = Array.from(new Set([...(existing.completedDates || []), ...(lHabit.completedDates || [])]));
      map.set(lHabit.id, {
        ...existing,
        completedDates: combinedDates,
        streak: combinedDates.length,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Hợp nhất toàn bộ dữ liệu ứng dụng một cách thông minh và an toàn 100%
 */
export function smartMergeAppData(localData: RawSyncData, remoteData: RawSyncData): RawSyncData {
  const mergedTasks = mergeTasks(localData.tasks || [], remoteData.tasks || []);
  const mergedNotebooks = mergeNotebooks(localData.notebooks || [], remoteData.notebooks || []);
  const mergedStickyNotes = mergeStickyNotes(localData.stickyNotes || [], remoteData.stickyNotes || []);
  const mergedHabits = mergeHabits(localData.habits || [], remoteData.habits || []);

  // Gộp Moods
  const mergedMoods: Record<string, string> = {
    ...(remoteData.dailyMoods || {}),
    ...(localData.dailyMoods || {}),
  };

  // Gộp Weekly Reflection (Ưu tiên nội dung dài hơn hoặc mới hơn)
  const mergedReflection =
    (localData.weeklyReflection && localData.weeklyReflection.length > (remoteData.weeklyReflection?.length || 0))
      ? localData.weeklyReflection
      : (remoteData.weeklyReflection || localData.weeklyReflection || "");

  // Gộp Tags
  const mergedTags = Array.from(new Set([...(localData.tags || []), ...(remoteData.tags || [])]));

  return {
    tasks: mergedTasks,
    notebooks: mergedNotebooks,
    stickyNotes: mergedStickyNotes,
    habits: mergedHabits,
    dailyMoods: mergedMoods,
    weeklyReflection: mergedReflection,
    tags: mergedTags,
  };
}

