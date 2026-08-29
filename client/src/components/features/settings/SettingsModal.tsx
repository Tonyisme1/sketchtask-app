import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../ui/Button";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { CustomAvatarPicker } from "../../ui/CustomAvatarPicker";
import { CURRENT_APP_VERSION } from "../../../services/updateService";
import { sounds } from "../../../utils/soundEffects";
import {
  Settings,
  User,
  Cloud,
  Info,
  Download,
  Upload,
  RotateCcw,
  RefreshCw,
  X,
  Zap,
  Check,
  Edit2,
  Lightbulb,
  Volume2,
  VolumeX,
  FileText,
  Database,
  Archive,
  Sparkles,
  Lock,
  Shield,
  Key,
  ArrowRight,
  Play,
} from "lucide-react";
import { PinLockModal } from "../auth/PinLockModal";

// ==========================================
// COMPONENT: SettingsModal (Cài Đặt Hệ Thống Pro)
// ==========================================

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenIntro?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenIntro,
}) => {
  const {
    user,
    logout,
    updateUserProfile,
    syncNow,
    syncStatus,
    lastSyncedAt,
    isOnline,
    isTiltEnabled,
    setIsTiltEnabled,
    hideCompletedTasks,
    setHideCompletedTasks,
    isNotificationsEnabled,
    setIsNotificationsEnabled,
    isDarkMode,
    setIsDarkMode,
    isSoundEnabled,
    setIsSoundEnabled,
    soundVolume,
    setSoundVolume,
    paperStyle,
    setPaperStyle,
    pinCode,
    setPinCode,
    loadSampleData,
    archiveOldTasks,
    tasks,
    notebooks,
    stickyNotes,
    habits,
    tags,
    dailyMoods,
    weeklyReflection,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "data" | "about">(
    "general",
  );
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"setup" | "change" | "disable" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [editingName, setEditingName] = useState(user.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingName(user.name);
  }, [user.name]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Khóa cứng thanh cuộn khi mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  // Tính toán dung lượng bộ nhớ LocalStorage thực tế
  const storageHealth = useMemo(() => {
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sketchtask")) {
          const val = localStorage.getItem(key) || "";
          totalBytes += key.length + val.length * 2; // UTF-16
        }
      }
    } catch {
      totalBytes = 10240;
    }
    const kb = (totalBytes / 1024).toFixed(1);
    const percent = Math.min(100, Math.round((totalBytes / (5 * 1024 * 1024)) * 100));
    return { kb, percent };
  }, [tasks, notebooks, stickyNotes, habits, isOpen]);

  if (!isOpen || !mounted) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Đồng bộ đám mây thật
  const handleCloudSync = async () => {
    if (!user.isSignedIn) {
      onClose();
      onOpenAuth();
      return;
    }
    setIsSyncing(true);
    const success = await syncNow();
    setIsSyncing(false);
    if (success) {
      showToast("✓ Đã đồng bộ dữ liệu đám mây thành công!");
    } else {
      showToast("⚠️ Đồng bộ thất bại. Vui lòng thử lại!");
    }
  };

  // Xuất file dữ liệu JSON
  const handleExportData = () => {
    const dataToExport = {
      version: CURRENT_APP_VERSION,
      exportDate: new Date().toISOString(),
      user: { name: user.name, email: user.email },
      tasks,
      tags,
      notebooks,
      stickyNotes,
      habits,
      dailyMoods,
      weeklyReflection,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sketchtask-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("✓ Đã tải file sao lưu về máy!");
  };

  // Nhập dữ liệu JSON từ máy
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tasks) {
          localStorage.setItem(
            "sketchtask_local_storage_v2_tasks",
            JSON.stringify(json.tasks),
          );
        }
        if (json.notebooks) {
          localStorage.setItem(
            "sketchtask_local_storage_v2_notebooks",
            JSON.stringify(json.notebooks),
          );
        }
        if (json.stickyNotes) {
          localStorage.setItem(
            "sketchtask_local_storage_v2_notes",
            JSON.stringify(json.stickyNotes),
          );
        }
        if (json.habits) {
          localStorage.setItem(
            "sketchtask_local_storage_v2_habits",
            JSON.stringify(json.habits),
          );
        }
        if (json.tags) {
          localStorage.setItem(
            "sketchtask_local_storage_v2_tags",
            JSON.stringify(json.tags),
          );
        }

        showToast("✓ Nhập dữ liệu thành công! Đang tải lại...");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (err) {
        showToast("⚠️ File không đúng định dạng!");
      }
    };
    reader.readAsText(file);
  };

  // Thực hiện lưu trữ các task cũ
  const handlePerformArchive = () => {
    const count = archiveOldTasks(60);
    setConfirmArchiveOpen(false);
    if (count > 0) {
      showToast(`✓ Đã dọn dẹp và lưu trữ ${count} công việc cũ!`);
    } else {
      showToast("Không có công việc nào hoàn thành quá 60 ngày cần dọn dẹp.");
    }
  };

  // Reset toàn bộ dữ liệu về mặc định
  const handleResetData = () => {
    localStorage.clear();
    showToast("✓ Đã đặt lại toàn bộ ứng dụng!");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return createPortal(
    <div
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        touchAction: "none",
      }}
      className="flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
    >
      {/* Settings Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md h-[560px] max-h-[92vh] bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200 z-[1000000]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FEF08A] border border-[#262626] rounded-[4px] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <Settings size={17} strokeWidth={2.2} className="text-[#1C1917]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1C1917]">Cài Đặt Ứng Dụng</h3>
              <p className="text-[10px] text-[#78716C] font-mono">Tùy chỉnh & Đồng bộ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#78716C] hover:text-[#1C1917] p-1 bg-white border border-[#D4CEBF] rounded active:translate-y-[0.5px]"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* 3 Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-0.5 my-2.5 bg-white border border-[#262626] rounded-[4px]">
          {[
            { key: "general", label: "Chung", Icon: User },
            { key: "data", label: "Dữ liệu", Icon: Cloud },
            { key: "about", label: "Giới thiệu", Icon: Info },
          ].map((t) => {
            const IconComp = t.Icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as any)}
                className={`py-1.5 rounded-[2px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === t.key
                    ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                    : "text-[#78716C] hover:bg-[#F3EFE6]"
                }`}
              >
                <IconComp size={13} strokeWidth={2.2} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
          {/* TAB 1: CHUNG & GIAO DIỆN */}
          {activeTab === "general" && (
            <div className="space-y-3 text-xs">
              {/* Thẻ Hồ Sơ & Avatar Cá Nhân */}
              <div className="p-3 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                    <User size={13} strokeWidth={2.2} />
                    <span>HỒ SƠ CÁ NHÂN:</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      user.isSignedIn
                        ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {user.isSignedIn ? "Đã kết nối" : "Chế độ Khách"}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <CustomAvatarPicker
                    avatar={user.avatar || "lucide:User"}
                    avatarBg={user.avatarBg || "#BBF7D0"}
                    onChange={(newAvatar, newBg) => {
                      updateUserProfile({ avatar: newAvatar, avatarBg: newBg });
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingName}
                          maxLength={25}
                          autoFocus
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editingName.trim()) {
                              updateUserProfile({ name: editingName.trim() });
                              setIsEditingName(false);
                            } else if (e.key === "Escape") {
                              setIsEditingName(false);
                            }
                          }}
                          className="w-full px-2 py-1 text-xs bg-[#FBF9F4] border border-[#262626] rounded-[3px] outline-none font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editingName.trim()) {
                              updateUserProfile({ name: editingName.trim() });
                              setIsEditingName(false);
                            }
                          }}
                          className="p-1 bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] rounded text-[10px] font-bold shadow-sm shrink-0"
                        >
                          <Check size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs sm:text-sm text-[#1C1917] truncate">
                          {user.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          title="Đổi tên hiển thị"
                          className="text-[#78716C] hover:text-[#1C1917] p-0.5"
                        >
                          <Edit2 size={11} strokeWidth={2.2} />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-[#78716C] font-mono truncate mt-0.5">
                      {user.isSignedIn ? user.email : "Chạm avatar để đổi icon"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D4CEBF] flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="flex-1 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] rounded text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {user.isSignedIn
                        ? "Quản lý tài khoản cá nhân"
                        : "Đăng nhập / Đăng ký đồng bộ"}
                    </span>
                    {!user.isSignedIn && <ArrowRight size={13} />}
                  </button>

                  {user.isSignedIn && (
                    <button
                      type="button"
                      onClick={logout}
                      className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded font-bold text-xs"
                    >
                      Đăng xuất
                    </button>
                  )}
                </div>
              </div>

              {/* TÙY BIẾN CHẤT LIỆU TRANG GIẤY */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-2">
                <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                  <FileText size={13} strokeWidth={2.2} />
                  <span>CHẤT LIỆU TRANG GIẤY:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                  {[
                    { key: "blank", label: "Giấy Trơn", desc: "Ấm áp" },
                    { key: "lined", label: "Kẻ Ngang", desc: "Nhật ký" },
                    { key: "dots", label: "Chấm Bi", desc: "Bullet" },
                    { key: "grid", label: "Ô Vuông", desc: "Kỹ thuật" },
                  ].map((style) => (
                    <button
                      key={style.key}
                      type="button"
                      onClick={() => setPaperStyle(style.key as any)}
                      className={`p-2 rounded-[4px] border text-center transition-all ${
                        paperStyle === style.key
                          ? "bg-[#FEF08A] border-[#262626] font-bold shadow-[1.5px_1.5px_0px_#262626]"
                          : "bg-[#FBF9F4] border-[#D4CEBF] text-[#78716C] hover:text-[#1C1917]"
                      }`}
                    >
                      <p className="text-xs font-bold text-[#1C1917]">{style.label}</p>
                      <p className="text-[9px] text-[#78716C] mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ÂM THANH NÉT BÚT VẬT LÝ */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                    {isSoundEnabled ? (
                      <Volume2 size={13} className="text-amber-600" />
                    ) : (
                      <VolumeX size={13} className="text-[#78716C]" />
                    )}
                    <span>ÂM THANH BÚT CHÌ VẬT LÝ:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSoundEnabled(!isSoundEnabled);
                      if (!isSoundEnabled) sounds.playPencilCheck(soundVolume);
                    }}
                    className={`w-14 h-6 border-[1.5px] border-[#262626] rounded-[4px] transition-all p-0.5 flex items-center shadow-[1px_1px_0px_#262626] select-none ${
                      isSoundEnabled ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                    }`}
                  >
                    <span className="h-4 px-1 rounded-[2px] border border-[#262626] bg-white text-[8.5px] font-mono font-bold flex items-center justify-center">
                      {isSoundEnabled ? "BẬT" : "TẮT"}
                    </span>
                  </button>
                </div>

                {isSoundEnabled && (
                  <div className="pt-1 flex items-center justify-between gap-3">
                    <span className="text-[10px] text-[#78716C] shrink-0">Âm lượng:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSoundVolume(val);
                      }}
                      className="w-full h-1.5 bg-[#F3EFE6] rounded-lg appearance-none cursor-pointer accent-[#262626]"
                    />
                    <button
                      type="button"
                      onClick={() => sounds.playPencilCheck(soundVolume)}
                      className="px-2 py-0.5 bg-[#FBF9F4] hover:bg-[#FEF08A] border border-[#262626] rounded text-[10px] font-bold shadow-sm shrink-0 flex items-center gap-1"
                    >
                      <Play size={10} className="fill-[#1C1917]" />
                      <span>Thử nghe</span>
                    </button>
                  </div>
                )}
              </div>

              {/* TÙY BIẾN KHÁC */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-3">
                <span className="font-bold text-[11px] text-[#1C1917] block">
                  TÙY CHỌN KHÁC:
                </span>

                {/* Độ nghiêng */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#1C1917]">Nghiêng giấy tự nhiên</p>
                    <p className="text-[10px] text-[#78716C]">Thẻ bài xoay nhẹ như trên bàn gỗ</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTiltEnabled(!isTiltEnabled)}
                    className={`w-14 h-6 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] ${
                      isTiltEnabled ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                    }`}
                  >
                    <span className="h-4 px-1 rounded-[2px] border border-[#262626] bg-white text-[8.5px] font-mono font-bold">
                      {isTiltEnabled ? "BẬT" : "TẮT"}
                    </span>
                  </button>
                </div>

                {/* Tự động ẩn việc đã xong */}
                <div className="flex items-center justify-between pt-2 border-t border-[#D4CEBF]/60">
                  <div>
                    <p className="font-bold text-xs text-[#1C1917]">Tự động ẩn việc đã xong</p>
                    <p className="text-[10px] text-[#78716C]">Làm gọn danh sách khi tick hoàn tất</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
                    className={`w-14 h-6 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] ${
                      hideCompletedTasks ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                    }`}
                  >
                    <span className="h-4 px-1 rounded-[2px] border border-[#262626] bg-white text-[8.5px] font-mono font-bold">
                      {hideCompletedTasks ? "BẬT" : "TẮT"}
                    </span>
                  </button>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between pt-2 border-t border-[#D4CEBF]/60">
                  <div>
                    <p className="font-bold text-xs text-[#1C1917]">Chế độ Ban Đêm</p>
                    <p className="text-[10px] text-[#78716C]">Giấy than đen êm mắt</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-14 h-6 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] ${
                      isDarkMode ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                    }`}
                  >
                    <span className="h-4 px-1 rounded-[2px] border border-[#262626] bg-white text-[8.5px] font-mono font-bold">
                      {isDarkMode ? "BẬT" : "TẮT"}
                    </span>
                  </button>
                </div>
              </div>

              {/* BẢO MẬT & MÃ PIN (APP LOCK) */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                    <Lock size={13} className="text-amber-700" strokeWidth={2.2} />
                    <span>KHÓA MÃ PIN BẢO VỆ:</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      pinCode
                        ? "bg-[#BBF7D0] text-emerald-900 border-[#262626]"
                        : "bg-[#F3EFE6] text-[#78716C] border-[#D4CEBF]"
                    }`}
                  >
                    {pinCode ? "Đã bật bảo vệ" : "Chưa cài đặt"}
                  </span>
                </div>

                <p className="text-[10px] text-[#78716C] leading-relaxed">
                  Khóa ứng dụng bằng mã PIN 4 số để bảo vệ sổ tay và ghi chú ý tưởng của bạn.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  {pinCode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPinModalMode("change")}
                        className="flex-1 py-1.5 bg-[#FBF9F4] hover:bg-[#FEF08A] border border-[#262626] rounded text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
                      >
                        Đổi mã PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => setPinModalMode("disable")}
                        className="py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded text-xs font-bold active:translate-y-[0.5px]"
                      >
                        Tắt khóa
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPinModalMode("setup")}
                      className="w-full py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] rounded text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
                    >
                      + Thiết lập mã PIN (4 số)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐỒNG BỘ & DỮ LIỆU */}
          {activeTab === "data" && (
            <div className="space-y-3 text-xs">
              {/* Trạm Kiểm Soát Dung Lượng (Data Health Hub) */}
              <div className="p-3 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                    <Database size={13} strokeWidth={2.2} />
                    <span>TRẠM KIỂM SOÁT DUNG LƯỢNG:</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#F3EFE6] px-1.5 py-0.2 rounded border border-[#D4CEBF]">
                    {storageHealth.kb} KB / 5 MB
                  </span>
                </div>

                <div className="w-full h-1.5 bg-[#F3EFE6] border border-[#262626] rounded-[2px] overflow-hidden">
                  <div
                    className="h-full bg-[#BBF7D0] border-r border-[#262626] transition-all"
                    style={{ width: `${Math.max(2, storageHealth.percent)}%` }}
                  />
                </div>

                <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-[#D4CEBF]/60">
                  <div>
                    <p className="font-bold text-xs text-[#1C1917]">Lưu trữ việc cũ ({">"} 60 ngày)</p>
                    <p className="text-[10px] text-[#78716C]">Dọn dẹp công việc cũ để app luôn nhẹ như mới</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmArchiveOpen(true)}
                    className="px-2.5 py-1.5 bg-[#FBF9F4] hover:bg-[#FEF08A] text-[#1C1917] border border-[#262626] rounded text-xs font-bold shadow-[1px_1px_0px_#262626] flex items-center gap-1 active:translate-y-[0.5px] shrink-0"
                  >
                    <Archive size={12} />
                    <span>Dọn việc cũ</span>
                  </button>
                </div>
              </div>

              {/* Thẻ Đồng Bộ Đám Mây Tự Động */}
              <div className="p-3 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2.5">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                    <Cloud size={14} strokeWidth={2.2} />
                    <span>ĐỒNG BỘ REALTIME:</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#262626] inline-flex items-center gap-1.5 shrink-0 ${
                      user.isSignedIn ? "text-emerald-900 bg-[#BBF7D0]" : "text-amber-900 bg-[#FEF08A]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        user.isSignedIn ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                      }`}
                    />
                    <span>{user.isSignedIn ? "Realtime Online" : "Chưa đăng nhập"}</span>
                  </span>
                </div>

                <p className="text-xs text-[#1C1917] leading-relaxed">
                  {user.isSignedIn
                    ? `Dữ liệu đang được kết nối và đồng bộ tự động với máy chủ. Lần đồng bộ gần nhất: ${
                        lastSyncedAt || "Vừa xong"
                      }.`
                    : "Đăng nhập tài khoản để đồng bộ hóa hai chiều tức thì giữa điện thoại và máy tính không lo mất dữ liệu."}
                </p>

                {user.isSignedIn ? (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleCloudSync}
                    className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] font-bold flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <RefreshCw size={14} strokeWidth={2.2} className={isSyncing ? "animate-spin" : ""} />
                    <span>{isSyncing ? "Đang đồng bộ đám mây..." : "Đồng bộ ngay bây giờ"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="w-full py-2 bg-[#262626] hover:bg-[#1C1917] text-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#A8A29E] font-bold flex items-center justify-center gap-1.5 active:translate-y-[0.5px] transition-all"
                  >
                    <span>Đăng nhập / Đăng ký để bật đồng bộ</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {/* Tùy Chọn Sao Lưu Dự Phòng */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-2">
                <span className="font-bold text-[11px] text-[#1C1917] block">
                  SAO LƯU THỦ CÔNG (DỰ PHÒNG):
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="py-1.5 bg-[#FBF9F4] hover:bg-white border border-[#262626] rounded font-bold flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    <Download size={13} strokeWidth={2.2} />
                    <span>Tải file sao lưu</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 bg-[#FBF9F4] hover:bg-white border border-[#262626] rounded font-bold flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    <Upload size={13} strokeWidth={2.2} />
                    <span>Phục hồi file JSON</span>
                  </button>
                </div>
              </div>

              {/* Dữ Liệu Mẫu */}
              <div className="p-3 bg-[#FEF08A]/30 border border-[#D4CEBF] rounded-[6px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                    <Zap size={13} className="text-amber-600" />
                    <span>DỮ LIỆU MẪU ĐẦY ĐỦ:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      loadSampleData();
                      showToast("✓ Đã nạp dữ liệu mẫu phong phú!");
                    }}
                    className="px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] rounded text-[11px] font-bold shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] flex items-center gap-1"
                  >
                    <span>Thử ngay</span>
                    <Sparkles size={11} className="text-amber-700" />
                  </button>
                </div>
                <p className="text-[10px] text-[#78716C] leading-relaxed">
                  Tự động điền công việc, sổ tay, thói quen và ghi chú mẫu để khám phá toàn bộ tính năng.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: GIỚI THIỆU & GIÚP ĐỠ */}
          {activeTab === "about" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2">
                <h4 className="font-bold text-sm sm:text-base text-[#1C1917]">
                  SketchTask - Sổ Tay Công Việc Cá Nhân
                </h4>
                <div className="inline-block">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#F3EFE6] border border-[#D4CEBF] rounded-[3px] text-[#78716C]">
                    Phiên bản: v{CURRENT_APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-[#1C1917] leading-relaxed pt-1">
                  SketchTask được thiết kế như một cuốn sổ tay giấy vẽ tay ấm áp, giúp bạn sắp xếp công việc mỗi ngày, rèn luyện thói quen tốt và ghi lại những ý tưởng bất chợt.
                </p>
              </div>

              {/* Nút Xem Lại Intro */}
              {onOpenIntro && (
                <div className="p-3 bg-[#FEF08A]/40 border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1C1917] text-[11px]">
                      Màn hình giới thiệu (Intro)
                    </p>
                    <p className="text-[10px] text-[#78716C]">
                      Xem lại các tính năng cốt lõi của ứng dụng
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenIntro();
                    }}
                    className="px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917] border border-[#262626] rounded text-[11px] font-bold shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] flex items-center gap-1"
                  >
                    <span>Xem Intro</span>
                    <Sparkles size={11} className="text-amber-700" />
                  </button>
                </div>
              )}

              {/* Mẹo Sử Dụng */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-2">
                <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-amber-500" />
                  <span>PHÍM TẮT & MẸO DÙNG:</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#1C1917] leading-relaxed list-disc list-inside">
                  <li><strong>Ctrl + K:</strong> Mở tìm kiếm thông minh không dấu mọi lúc.</li>
                  <li><strong>Hôm nay:</strong> Tập trung làm những việc quan trọng nhất.</li>
                  <li><strong>Kế hoạch:</strong> Xem lịch tuần/tháng và lên lịch trước.</li>
                  <li><strong>Sổ tay:</strong> Phân loại công việc theo dự án riêng.</li>
                  <li><strong>Ý tưởng:</strong> Dán thẻ ghi chú nhanh và ghim lên đầu.</li>
                </ul>
              </div>

              {/* Đặt Lại Ứng Dụng */}
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-[6px] flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-rose-800">Đặt lại toàn bộ ứng dụng</p>
                  <p className="text-[10px] text-[#78716C]">Xóa toàn bộ dữ liệu trên máy về ban đầu</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="px-2.5 py-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-300 rounded font-bold text-xs shadow-sm"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toast thông báo sao lưu/đồng bộ */}
        {toastMessage && (
          <div className="mt-2 p-2 bg-[#262626] text-white rounded text-center text-xs font-bold animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2.5 mt-2 border-t border-[#D4CEBF] flex justify-end">
          <Button onClick={onClose} variant="primary" size="md">
            Đóng
          </Button>
        </div>
      </div>

      {/* Modal Xác Nhận Reset */}
      <ConfirmModal
        isOpen={confirmResetOpen}
        title="Đặt lại toàn bộ ứng dụng"
        message="Hành động này sẽ xóa dữ liệu trên máy và đưa về mặc định. Bạn có chắc chắn không?"
        confirmText="Đồng ý xóa"
        onConfirm={handleResetData}
        onCancel={() => setConfirmResetOpen(false)}
      />

      {/* Modal Xác Nhận Lưu Trữ Việc Cũ */}
      <ConfirmModal
        isOpen={confirmArchiveOpen}
        title="Lưu trữ & dọn dẹp việc cũ"
        message="Các công việc đã hoàn thành cách đây hơn 60 ngày sẽ được dọn sạch để danh sách luôn mượt mà. Bạn có muốn tiếp tục?"
        confirmText="Dọn việc cũ"
        onConfirm={handlePerformArchive}
        onCancel={() => setConfirmArchiveOpen(false)}
      />

      {/* Modal Thiết Lập / Đổi / Tắt Mã PIN */}
      {pinModalMode && (
        <PinLockModal
          isOpen={true}
          mode={pinModalMode}
          currentPinHash={pinCode || ""}
          onSuccess={(newPin) => {
            if (pinModalMode === "setup" && newPin) {
              setPinCode(newPin);
              setPinModalMode(null);
              showToast("✓ Đã thiết lập mã PIN bảo vệ thành công!");
            } else if (pinModalMode === "change" && newPin) {
              setPinCode(newPin);
              setPinModalMode(null);
              showToast("✓ Đã đổi mã PIN thành công!");
            } else if (pinModalMode === "disable") {
              setPinCode(null);
              setPinModalMode(null);
              showToast("✓ Đã tắt khóa mã PIN!");
            }
          }}
          onCancel={() => setPinModalMode(null)}
        />
      )}
    </div>,
    document.body,
  );
};
