import React from "react";
import { JournalBook } from "./JournalBook";
import { NavigationTarget, TabKey } from "../../../types";

// ==========================================
// COMPONENT: JournalTab
// Orchestrator Điều Phối Chính Của Phân Hệ Nhật Ký Cuốn Tập
// ==========================================

export interface JournalTabProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
}) => {
  return (
    <div className="w-full min-w-0 space-y-4 pb-12 animate-in fade-in duration-150">
      <JournalBook
        initialDate={navigationTarget?.date}
        initialEntryId={navigationTarget?.journalEntryId}
        notebookId={navigationTarget?.notebookId}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
