import React from "react";
import { BookOpen, FileText } from "lucide-react";
import { TabKey } from "../../../types";
import { SketchTabs } from "../../../components/layout/SketchTabs";

export interface NotesSectionTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: "notes" | "journal") => void;
  className?: string;
}

// === PHAN 1: Parent Ghi chep giu hai loai du lieu tach biet ===
export const NotesSectionTabs: React.FC<NotesSectionTabsProps> = ({
  activeTab,
  onTabChange,
  className,
}) => (
  <SketchTabs
    ariaLabel="Chuyển khu vực ghi chép"
    value={activeTab === "journal" ? "journal" : "notes"}
    onChange={onTabChange}
    className={`mb-4 ${className || ""}`}
    items={[
      { key: "notes", label: "Ghi chú", icon: <FileText size={14} strokeWidth={2.4} /> },
      { key: "journal", label: "Nhật ký", icon: <BookOpen size={14} strokeWidth={2.4} /> },
    ]}
  />
);
