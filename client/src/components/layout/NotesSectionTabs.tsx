import React from "react";
import { BookOpen, FileText } from "lucide-react";
import { TabKey } from "../../types";
import { SketchTabs } from "./SketchTabs";

export interface NotesSectionTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: "notes" | "journal") => void;
}

// Bộ chuyển cấp con dùng chung cho desktop/tablet, không phụ thuộc sidebar.
export const NotesSectionTabs: React.FC<NotesSectionTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <SketchTabs
      ariaLabel="Chuyển khu vực ghi chép"
      value={activeTab === "journal" ? "journal" : "notes"}
      onChange={onTabChange}
      className="mb-4"
      items={[
        { key: "notes", label: "Ghi chú", icon: <FileText size={14} strokeWidth={2.4} /> },
        { key: "journal", label: "Nhật ký", icon: <BookOpen size={14} strokeWidth={2.4} /> },
      ]}
    />
  );
};
