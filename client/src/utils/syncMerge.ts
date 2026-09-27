import { TaskDto, HabitDto, JournalEntryDto, DeletedEntityIds, SyncPayload } from "../types";
import { StickyNoteItem } from "../stores/appStore";
import { calculateConsecutiveStreak } from "./habitSemantics";
import { normalizeTaskTagFields } from "./taskSemantics";

// ==========================================
// UTILS: Smart Merge Engine (Giải quyết xung đột Offline-First & Đăng nhập)
// ==========================================

export interface RawSyncData {
  tasks: TaskDto[];
  stickyNotes: StickyNoteItem[];
  habits: HabitDto[];
  journalEntries: JournalEntryDto[];
  dailyMoods: Record<string, string>;
  weeklyReflection: string;
  tags: string[];
  deleted?: Partial<DeletedEntityIds>;
}

const fallbackTimestamp = "1970-01-01T00:00:00.000Z";

const normalizeTaskStatus = (status: unknown, completed: boolean): TaskDto["status"] =>
  status === "in_progress" || status === "completed" || status === "archived" || status === "todo"
    ? status
    : completed
      ? "completed"
      : "todo";

const normalizeTaskPriority = (priority: unknown): TaskDto["priority"] =>
  priority === "high" || priority === "low" ? priority : "medium";

const normalizeTaskTimeType = (timeType: unknown): TaskDto["timeType"] =>
  timeType === "scheduled" || timeType === "deadline" || timeType === "event" || timeType === "task"
    ? timeType
    : undefined;

const normalizeNoteColor = (color: string): StickyNoteItem["color"] => {
  const validColors: StickyNoteItem["color"][] = [
    "yellow", "coral", "mint", "sky", "lavender", "peach", "lime", "pink", "cyan", "stone",
  ];
  return validColors.includes(color as StickyNoteItem["color"])
    ? color as StickyNoteItem["color"]
    : "sky";
};

/** Convert a permissive transport response into the non-null state consumed by the UI. */
export const normalizeSyncPayloadForMerge = (payload: SyncPayload): RawSyncData => ({
  tasks: payload.tasks.map((task): TaskDto => {
    const completed = Boolean(task.completed);
    return normalizeTaskTagFields({
      id: task.id,
      title: task.title,
      description: task.description ?? undefined,
      completed,
      dueDate: task.dueDate ?? undefined,
      startDate: task.startDate ?? undefined,
      endDate: task.endDate ?? undefined,
      itemType: task.itemType === "event" ? "event" : "task",
      timeType: normalizeTaskTimeType(task.timeType),
      startTime: task.startTime ?? undefined,
      endTime: task.endTime ?? undefined,
      deadlineDate: task.deadlineDate ?? undefined,
      deadlineTime: task.deadlineTime ?? undefined,
      tag: task.tag ?? task.tags?.[0] ?? undefined,
      tags: task.tags?.filter((tag): tag is string => typeof tag === "string"),
      priority: normalizeTaskPriority(task.priority),
      status: normalizeTaskStatus(task.status, completed),
      parentTaskId: task.parentTaskId ?? undefined,
      createdAt: task.createdAt || fallbackTimestamp,
      updatedAt: task.updatedAt || task.createdAt || fallbackTimestamp,
    });
  }),
  stickyNotes: payload.stickyNotes.map((note): StickyNoteItem => ({
    id: note.id,
    title: note.title,
    content: note.content,
    color: normalizeNoteColor(note.color),
    tilt: note.tilt === "left" || note.tilt === "right" ? note.tilt : "none",
    isPinned: Boolean(note.isPinned),
    createdAt: note.createdAt || fallbackTimestamp,
    updatedAt: note.updatedAt || note.createdAt || fallbackTimestamp,
  })),
  habits: payload.habits.map((habit): HabitDto => ({
    id: habit.id,
    name: habit.name,
    frequency: habit.frequency === "weekly" ? "weekly" : "daily",
    targetDaysPerWeek: habit.targetDaysPerWeek ?? undefined,
    completedDates: habit.completedDates,
    streak: habit.streak ?? calculateConsecutiveStreak(habit.completedDates),
    createdAt: habit.createdAt || fallbackTimestamp,
    updatedAt: habit.updatedAt || habit.createdAt || fallbackTimestamp,
  })),
  journalEntries: (payload.journalEntries || []).map((entry): JournalEntryDto => ({
    id: entry.id,
    date: entry.date,
    time: entry.time || "00:00",
    content: entry.content,
    linkedTaskId: entry.linkedTaskId ?? undefined,
    createdAt: entry.createdAt || fallbackTimestamp,
    updatedAt: entry.updatedAt || entry.createdAt || fallbackTimestamp,
  })),
  dailyMoods: Object.fromEntries(
    Object.entries(payload.dailyMoods).flatMap(([date, mood]) => {
      const moodEmoji = typeof mood === "string" ? mood : mood.moodEmoji;
      return moodEmoji ? [[date, moodEmoji]] : [];
    }),
  ),
  weeklyReflection: typeof payload.weeklyReflection === "string"
    ? payload.weeklyReflection
    : payload.weeklyReflection.text,
  tags: payload.tags,
  deleted: payload.deleted,
});

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
  }).map(normalizeTaskTagFields);
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
