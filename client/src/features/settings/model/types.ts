import { AppContextType } from "../../../stores/appStore";

export type SettingsScreenModel = Pick<
  AppContextType,
  | "user"
  | "updateUserProfile"
  | "logout"
  | "syncNow"
  | "lastSyncedAt"
  | "interfaceStyle"
  | "setInterfaceStyle"
  | "isTiltEnabled"
  | "setIsTiltEnabled"
  | "isNotificationsEnabled"
  | "setIsNotificationsEnabled"
  | "isDarkMode"
  | "setIsDarkMode"
  | "isSoundEnabled"
  | "setIsSoundEnabled"
  | "soundVolume"
  | "setSoundVolume"
  | "fontSize"
  | "setFontSize"
  | "fontFamily"
  | "setFontFamily"
  | "paperStyle"
  | "setPaperStyle"
  | "pinCode"
  | "setPinCode"
  | "loadSampleData"
  | "tasks"
  | "stickyNotes"
  | "journalEntries"
  | "openAuthModal"
  | "settingsMobileSubView"
  | "setSettingsMobileSubView"
> & {
  isLandscape: boolean;
};
