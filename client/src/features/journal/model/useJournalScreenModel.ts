import { useState, useMemo, useCallback, useEffect } from "react";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../hooks";
import { JournalEntryDto } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import { JournalScreenModel } from "./types";

export interface UseJournalScreenModelOptions {
  initialDate?: string;
  initialEntryId?: string;
  onClearTarget?: () => void;
}

export const useJournalScreenModel = (
  options?: UseJournalScreenModelOptions
): JournalScreenModel => {
  const {
    journalEntries,
    tasks,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    journalPromptTask,
    setJournalPromptTask,
    isJournalBookOpen,
    setIsJournalBookOpen,
  } = useAppStore();
  const { isMobile } = useResponsiveLayout();

  const todayStr = getLocalTodayStr(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    options?.initialDate || todayStr
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (options?.initialDate) {
      setSelectedDateStr(options.initialDate);
      setIsJournalBookOpen(true);
      options.onClearTarget?.();
    }
  }, [options, setIsJournalBookOpen]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return journalEntries;
    const q = searchQuery.toLowerCase().trim();
    return journalEntries.filter(
      (entry) =>
        entry.content.toLowerCase().includes(q) ||
        entry.date.includes(q)
    );
  }, [journalEntries, searchQuery]);

  const activeEntry = useMemo(() => {
    if (!selectedDateStr) return null;
    return journalEntries.find((e) => e.date === selectedDateStr) || null;
  }, [journalEntries, selectedDateStr]);

  const openEntry = useCallback(
    (dateStr: string) => {
      setSelectedDateStr(dateStr);
      setIsJournalBookOpen(true);
    },
    [setIsJournalBookOpen]
  );

  const closeBook = useCallback(() => {
    setIsJournalBookOpen(false);
  }, [setIsJournalBookOpen]);

  return {
    entries: journalEntries,
    tasks,
    filteredEntries,
    searchQuery,
    selectedDateStr,
    activeEntry,
    isBookOpen: isJournalBookOpen,
    isMobile,
    journalPromptTask,

    actions: {
      setSearchQuery,
      openEntry,
      closeBook,
      setBookOpen: setIsJournalBookOpen,
      addEntry: addJournalEntry,
      updateEntry: updateJournalEntry,
      deleteEntry: deleteJournalEntry,
      setJournalPromptTask,
    },
  };
};
