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

// Branding
export * from "./branding/BrandLogo";

// System
export * from "./system/ErrorBoundary";
