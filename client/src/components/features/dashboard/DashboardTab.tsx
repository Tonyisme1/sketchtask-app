import React from "react";
import { TabKey } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSummary } from "./DashboardSummary";
import { DashboardUpcoming } from "./DashboardUpcoming";
import { DashboardHabits } from "./DashboardHabits";
import { DashboardProgress } from "./DashboardProgress";
import { DashboardNotebooksGlance } from "./DashboardNotebooksGlance";
import { DashboardRecentJournal } from "./DashboardRecentJournal";

export interface DashboardTabProps {
  onNavigateTab?: (tab: TabKey) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigateTab }) => {
  const {
    user,
    tasks,
    habits,
    notebooks,
    journalEntries,
    toggleTask,
    toggleHabitDay,
    setActiveTaskSubTab,
  } = useAppStore();

  return (
    <div className="space-y-4 w-full min-w-0 pb-14 select-none animate-in fade-in duration-150">
      {/* 1. Header: Lời chào, ngày hiện tại, danh ngôn cảm hứng & phím tắt nhanh */}
      <DashboardHeader user={user} onNavigateTab={onNavigateTab} />

      {/* 2. Khu vực Tóm Tắt Nhanh (4 ô chỉ số thông tin toàn diện) */}
      <DashboardSummary
        tasks={tasks}
        journalEntries={journalEntries}
        onNavigateTab={onNavigateTab}
        onSelectTaskSubTab={setActiveTaskSubTab}
      />

      {/* 3. Bố Cục Nội Dung Đa Chiều: Desktop (2 Cột 7/12 & 5/12), Tablet & Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CỘT TRÁI (Desktop 7/12 - Lịch Trình, Hạn Chót & Thói Quen Hàng Ngày) */}
        <div className="lg:col-span-7 space-y-4">
          <DashboardUpcoming
            tasks={tasks}
            onNavigateTab={onNavigateTab}
            onSelectTaskSubTab={setActiveTaskSubTab}
            onToggleTask={toggleTask}
          />

          <DashboardHabits
            habits={habits}
            onToggleHabitDay={toggleHabitDay}
            onNavigateTab={onNavigateTab}
          />
        </div>

        {/* CỘT PHẢI (Desktop 5/12 - Tiến Độ, Sổ Tay & Nhật Ký Gần Đây) */}
        <div className="lg:col-span-5 space-y-4">
          <DashboardProgress tasks={tasks} />

          <DashboardNotebooksGlance
            notebooks={notebooks}
            tasks={tasks}
            onNavigateTab={onNavigateTab}
          />

          <DashboardRecentJournal
            journalEntries={journalEntries}
            tasks={tasks}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>
    </div>
  );
};
