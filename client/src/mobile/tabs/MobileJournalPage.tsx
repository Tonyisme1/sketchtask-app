import React, { useEffect } from "react";
import { JournalBook } from "../../components/shared/journal/JournalBook";
import { NavigationTarget, TabKey } from "../../types";
import {
  JournalScreenModel,
  useJournalScreenModel,
} from "../../features/journal/model/createJournalScreenModel";

export interface MobileJournalPageProps {
  model?: JournalScreenModel;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const MobileJournalPage: React.FC<MobileJournalPageProps> = ({
  model: propModel,
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
}) => {
  const defaultModel = useJournalScreenModel({
    initialDate: navigationTarget?.date,
    initialEntryId: navigationTarget?.journalEntryId,
    onClearTarget: onClearNavigationTarget,
  });
  const model = propModel || defaultModel;
  const setBookOpen = model.actions.setBookOpen;

  useEffect(() => {
    return () => setBookOpen(false);
  }, [setBookOpen]);

  return (
    <div className="w-full min-w-0 p-0 select-none mobile-tab-enter">
      <JournalBook
        model={model}
        initialDate={navigationTarget?.date}
        initialEntryId={navigationTarget?.journalEntryId}
        onClearNavigationTarget={onClearNavigationTarget}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
