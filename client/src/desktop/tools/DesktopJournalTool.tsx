import React, { useEffect } from "react";
import { JournalBook } from "../../components/shared/journal/JournalBook";
import { useJournalScreenModel } from "../../features/journal/model/createJournalScreenModel";

// === PHẦN 1: ỨNG DỤNG NHẬT KÝ THEO NGÀY TRONG RIGHT DOCK ===
export const DesktopJournalTool: React.FC = () => {
  const model = useJournalScreenModel();
  const setBookOpen = model.actions.setBookOpen;

  useEffect(() => {
    setBookOpen(true);
    return () => setBookOpen(false);
  }, [setBookOpen]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <JournalBook model={model} />
    </div>
  );
};
