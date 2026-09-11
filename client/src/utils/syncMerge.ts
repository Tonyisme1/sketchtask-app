import { TaskDto, HabitDto, JournalEntryDto, DeletedEntityIds } from "../types";
import { StickyNoteItem } from "../stores/appStore";
import { calculateConsecutiveStreak } from "./habitSemantics";

// ==========================================
// UTILS: Smart Merge Engine (Giải quyết xung đột Offline-First & Đăng nhập)
// ==========================================

export interface RawSyncData {
  tasks: TaskDto[];
  stickyNotes: StickyNoteItem[];
  habits: HabitDto[];
  journalEntries?: JournalEntryDto[];
  dailyMoods: Record<string, string>;
  weeklyReflection: string;
  tags: string[];
  deleted?: Partial<DeletedEntityIds>;
}

const mergeDeletedEntityIds = (
  local: Partial<DeletedEntityIds> = {},
  remote: Partial<DeletedEntityIds> = {},
): DeletedEntityIds => ({
  tasks: Array.from(new Set([...(local.tasks || []), ...(remote.tasks || [])])),
  stickyNotes: Array.from(new Set([...(local.stickyNotes || []), ...(remote.stickyNotes || [])])),
  habits: Array.from(new Set([...(local.habits || []), ...(remote.habits || [])])),
  journalEntries: Array.from(new Set([...(local.journalEntries || []), ...(remote.journalEntries || [])])),
  tags: Array.from(new Set([...(local.tags || []), ...(remote.tags || [])])),
});

const withoutDeleted = <T extends { id: string }>(items: T[], deletedIds: string[]) => {
  const deleted = new Set(deletedIds);
  return items.filter((item) => !deleted.has(item.id));
};

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
      } else if (
        // Older servers do not return parentTaskId. Keep the local hierarchy
        // metadata instead of silently flattening the task tree on pull.
        !Object.prototype.hasOwnProperty.call(existing, "parentTaskId") &&
        lTask.parentTaskId
      ) {
        map.set(lTask.id, { ...existing, parentTaskId: lTask.parentTaskId });
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
 * Hợp nhất Sticky Notes
 */
export function mergeStickyNotes(localNotes: StickyNoteItem[], remoteNotes: StickyNoteItem[]): StickyNoteItem[] {
  const map = new Map<string, StickyNoteItem>();

  for (const rNote of remoteNotes) {
    map.set(rNote.id, rNote);
  }

  for (const lNote of localNotes) {
    const existing = map.get(lNote.id);
    if (!existing) {
      map.set(lNote.id, lNote);
      continue;
    }

    const localTime = new Date(lNote.updatedAt || lNote.createdAt || 0).getTime();
    const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    if (localTime > remoteTime) {
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
        streak: calculateConsecutiveStreak(combinedDates),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Hợp nhất Nhật ký (Journal Entries) theo ID và Timestamp
 */
export function mergeJournalEntries(
  localEntries: JournalEntryDto[],
  remoteEntries: JournalEntryDto[],
): JournalEntryDto[] {
  const map = new Map<string, JournalEntryDto>();

  for (const r of remoteEntries) {
    map.set(r.id, r);
  }

  for (const l of localEntries) {
    const existing = map.get(l.id);
    if (!existing) {
      map.set(l.id, l);
    } else {
      const lTime = new Date(l.updatedAt || l.createdAt || 0).getTime();
      const rTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (lTime > rTime) {
        map.set(l.id, l);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.time || "").localeCompare(a.time || "");
  });
}

/**
 * Hợp nhất toàn bộ dữ liệu ứng dụng một cách thông minh và an toàn 100%
 */
export function smartMergeAppData(localData: RawSyncData, remoteData: RawSyncData): RawSyncData {
  const deleted = mergeDeletedEntityIds(localData.deleted, remoteData.deleted);
  const mergedTasks = withoutDeleted(
    mergeTasks(localData.tasks || [], remoteData.tasks || []),
    deleted.tasks,
  );
  const mergedStickyNotes = withoutDeleted(
    mergeStickyNotes(localData.stickyNotes || [], remoteData.stickyNotes || []),
    deleted.stickyNotes,
  );
  const mergedHabits = withoutDeleted(
    mergeHabits(localData.habits || [], remoteData.habits || []),
    deleted.habits,
  );
  const mergedJournalEntries = withoutDeleted(
    mergeJournalEntries(
    localData.journalEntries || [],
    remoteData.journalEntries || [],
    ),
    deleted.journalEntries,
  );

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
  const mergedTags = Array.from(
    new Set([...(localData.tags || []), ...(remoteData.tags || [])]),
  ).filter((tag) => !deleted.tags.includes(tag));

  return {
    tasks: mergedTasks,
    stickyNotes: mergedStickyNotes,
    habits: mergedHabits,
    journalEntries: mergedJournalEntries,
    dailyMoods: mergedMoods,
    weeklyReflection: mergedReflection,
    tags: mergedTags,
    deleted,
  };
}
