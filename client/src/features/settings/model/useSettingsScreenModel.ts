import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../hooks";
import { SettingsScreenModel } from "./types";

export const useSettingsScreenModel = (): SettingsScreenModel => {
  const store = useAppStore();
  const { isLandscape } = useResponsiveLayout();

  return {
    user: store.user,
    updateUserProfile: store.updateUserProfile,
    logout: store.logout,
    syncNow: store.syncNow,
    lastSyncedAt: store.lastSyncedAt,
    interfaceStyle: store.interfaceStyle,
    setInterfaceStyle: store.setInterfaceStyle,
    isTiltEnabled: store.isTiltEnabled,
    setIsTiltEnabled: store.setIsTiltEnabled,
    isNotificationsEnabled: store.isNotificationsEnabled,
    setIsNotificationsEnabled: store.setIsNotificationsEnabled,
    isDarkMode: store.isDarkMode,
    setIsDarkMode: store.setIsDarkMode,
    isSoundEnabled: store.isSoundEnabled,
    setIsSoundEnabled: store.setIsSoundEnabled,
    soundVolume: store.soundVolume,
    setSoundVolume: store.setSoundVolume,
    fontSize: store.fontSize,
    setFontSize: store.setFontSize,
    fontFamily: store.fontFamily,
    setFontFamily: store.setFontFamily,
    paperStyle: store.paperStyle,
    setPaperStyle: store.setPaperStyle,
    pinCode: store.pinCode,
    setPinCode: store.setPinCode,
    loadSampleData: store.loadSampleData,
    tasks: store.tasks,
    stickyNotes: store.stickyNotes,
    journalEntries: store.journalEntries,
    openAuthModal: store.openAuthModal,
    settingsMobileSubView: store.settingsMobileSubView,
    setSettingsMobileSubView: store.setSettingsMobileSubView,
    isLandscape,
  };
};
