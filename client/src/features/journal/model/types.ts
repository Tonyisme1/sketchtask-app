import { JournalEntryDto, TaskDto } from "../../../types";

export interface JournalScreenModel {
  entries: JournalEntryDto[];
  tasks: TaskDto[];
  filteredEntries: JournalEntryDto[];
  searchQuery: string;
  selectedDateStr: string | null;
  activeEntry: JournalEntryDto | null;
  isBookOpen: boolean;
  isMobile: boolean;
  journalPromptTask: TaskDto | null;

  actions: {
    setSearchQuery: (query: string) => void;
    openEntry: (dateStr: string) => void;
    closeBook: () => void;
    setBookOpen: (open: boolean) => void;
    addEntry: (data: { date: string; time: string; content: string; linkedTaskId?: string }) => JournalEntryDto;
    updateEntry: (id: string, updates: Partial<JournalEntryDto>) => void;
    deleteEntry: (id: string) => void;
    setJournalPromptTask: (task: TaskDto | null) => void;
  };
}
