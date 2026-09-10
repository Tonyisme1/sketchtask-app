// ==========================================
// BARREL EXPORT: client/src/components/ui/index.ts
// Re-export toàn bộ UI components theo cấu trúc mới
// ==========================================

// Core UI
export * from "./core/Button";
export * from "./core/TextInput";
export * from "./core/AutoResizeTextarea";
export * from "./core/HandDrawnCheckbox";
export * from "./core/DynamicIcon";

// Pickers
export * from "./pickers/select/CustomSelect";
export * from "./pickers/appearance/CustomColorPicker";
export * from "./pickers/appearance/CustomAvatarPicker";
export * from "./pickers/appearance/CustomEmojiPicker";
export * from "./pickers/time/CustomDuePicker";
export * from "./pickers/time/TimePicker.types";
export * from "./pickers/time/WheelColumn";
export * from "./pickers/time/WheelTimePicker";
export * from "./pickers/time/CalendarMonth";
export * from "./pickers/time/TimePickerSheet";
export * from "./pickers/time/TodayTimeView";
export * from "./pickers/time/PlannerDateTimeView";
export * from "./pickers/time/DateTimeView";
export * from "./pickers/time/TimeSliderAdjuster";
export * from "./pickers/time/TimePickerPopover";
export * from "./pickers/time/DatePickerPopover";

// Overlays
export * from "./overlays/ConfirmModal";
export * from "./overlays/UpdateModal";
export * from "./overlays/GlobalSearchModal";
export * from "./overlays/NotificationDrawer";

// Feedback
export * from "./feedback/EmptyStateDoodle";
export * from "./feedback/ToastViewport";
export * from "./feedback/ToastViewport";

// Branding
export * from "./branding/BrandLogo";
export * from "./branding/StickyNote";

// System
export * from "./system/ErrorBoundary";
