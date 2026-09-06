import React from "react";
import { PlannerDateTimeView, PlannerDateTimeViewProps } from "./PlannerDateTimeView";

// ==========================================
// SUB-COMPONENT: DateTimeView (Giao Diện Chọn Ngày & Giờ Đầy Đủ)
// Dùng cho EditTaskModal và NotebooksTab
// ==========================================

export type DateTimeViewProps = PlannerDateTimeViewProps;

export const DateTimeView: React.FC<DateTimeViewProps> = (props) => {
  return <PlannerDateTimeView {...props} />;
};
