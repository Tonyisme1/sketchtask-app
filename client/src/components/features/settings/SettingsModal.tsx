import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../ui/Button";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { CustomAvatarPicker } from "../../ui/CustomAvatarPicker";
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
  Smartphone,
  Check,
  Edit2,
  CheckSquare,
  BookOpen,
  Lightbulb,
  Flame,
  Radio,
} from "lucide-react";

// ==========================================
// COMPONENT: SettingsModal (Cài Đặt Hệ Thống với Icon Hiện Đại Sắc Nét)
// ==========================================

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
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
    loadSampleData,
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
      showToast("☁️ Đã đồng bộ dữ liệu mới nhất với đám mây!");
    } else {
      showToast("⚠️ Lỗi đồng bộ đám mây, vui lòng thử lại!");
    }
  };

  // Xuất file sao lưu dữ liệu JSON
  const handleExportData = () => {
    const backupData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      user,
      tasks,
      notebooks,
      stickyNotes,
      habits,
      tags,
      dailyMoods,
      weeklyReflection,
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `sketchtask_backup_${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast("✓ Đã xuất file sao lưu thành công!");
  };

  // Nhập file sao lưu JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tasks && Array.isArray(json.tasks)) {
          localStorage.setItem(
            "sketchtask_local_storage_v1_tasks",
            JSON.stringify(json.tasks),
          );
        }
        if (json.notebooks && Array.isArray(json.notebooks)) {
          localStorage.setItem(
            "sketchtask_local_storage_v1_notebooks",
            JSON.stringify(json.notebooks),
          );
        }
        if (json.notes || json.stickyNotes) {
          localStorage.setItem(
            "sketchtask_local_storage_v1_notes",
            JSON.stringify(json.notes || json.stickyNotes),
          );
        }
        if (json.habits && Array.isArray(json.habits)) {
          localStorage.setItem(
            "sketchtask_local_storage_v1_habits",
            JSON.stringify(json.habits),
          );
        }
        if (json.tags && Array.isArray(json.tags)) {
          localStorage.setItem(
            "sketchtask_local_storage_v1_tags",
            JSON.stringify(json.tags),
          );
        }
        if (json.dailyMoods) {
          localStorage.setItem(
            "sketchtask_local_storage_v1_moods",
            JSON.stringify(json.dailyMoods),
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        zIndex: 999999,
        backgroundColor: "rgba(38, 38, 38, 0.65)",
        touchAction: "none",
      }}
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150 pointer-events-auto"
    >
      {/* Settings Modal Box (Cố định chiều cao và tối ưu tràn viền mobile) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md h-[560px] max-h-[88vh] bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[16px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 z-[1000000] pb-6 sm:pb-5"
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-10 h-1 bg-[#D4CEBF] rounded-full mx-auto mb-3 sm:hidden" />
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FEF08A] border border-[#262626] rounded-[4px] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <Settings
                size={17}
                strokeWidth={2.2}
                className="text-[#1C1917]"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1C1917]">
                Cài Đặt Ứng Dụng
              </h3>
              <p className="text-[10px] text-[#78716C] font-mono">
                Tùy chỉnh & Đồng bộ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#78716C] hover:text-[#1C1917] p-1 bg-white border border-[#D4CEBF] rounded"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* 3 Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-0.5 my-3 bg-white border border-[#262626] rounded-[4px]">
          {[
            { key: "general", label: "Chung", Icon: User },
            { key: "data", label: "Đồng bộ", Icon: Cloud },
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
          {/* TAB 1: CHUNG */}
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
                  {/* Bộ Chọn Avatar Độc Đáo */}
                  <CustomAvatarPicker
                    avatar={user.avatar || "lucide:User"}
                    avatarBg={user.avatarBg || "#BBF7D0"}
                    onChange={(newAvatar, newBg) => {
                      updateUserProfile({ avatar: newAvatar, avatarBg: newBg });
                    }}
                  />

                  {/* Đổi Tên Hiển Thị */}
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
                            if (e.key === "Enter") {
                              if (editingName.trim()) {
                                updateUserProfile({ name: editingName.trim() });
                                setIsEditingName(false);
                              }
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
                      {user.isSignedIn
                        ? user.email
                        : "Chạm vào avatar để đổi icon"}
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
                    className="flex-1 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] rounded text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                  >
                    {user.isSignedIn
                      ? "Quản lý tài khoản cá nhân"
                      : "Đăng nhập / Đăng ký đồng bộ ➔"}
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

              {/* TÙY BIẾN TRẢI NGHIỆM */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-3">
                <span className="font-bold text-[11px] text-[#1C1917] block">
                  TRẢI NGHIỆM GIAO DIỆN:
                </span>

                {/* NÚT GẠT 1: ĐỘ NGHIÊNG GIẤY */}
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-[#1C1917]">
                    Nghiêng giấy tự nhiên
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsTiltEnabled(!isTiltEnabled)}
                    className={`w-11 h-6 rounded-full border-[1.5px] border-[#262626] transition-colors p-0.5 flex items-center shadow-[1px_1px_0px_#262626] ${
                      isTiltEnabled
                        ? "bg-[#BBF7D0] justify-end"
                        : "bg-gray-200 justify-start"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white border border-[#262626] shadow-sm" />
                  </button>
                </div>

                {/* NÚT GẠT 2: TỰ ĐỘNG ẨN VIỆC ĐÃ HOÀN THÀNH */}
                <div className="flex items-center justify-between pt-2 border-t border-[#D4CEBF]/60">
                  <p className="font-bold text-xs text-[#1C1917]">
                    Tự động ẩn việc đã xong
                  </p>
                  <button
                    type="button"
                    onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
                    className={`w-11 h-6 rounded-full border-[1.5px] border-[#262626] transition-colors p-0.5 flex items-center shadow-[1px_1px_0px_#262626] ${
                      hideCompletedTasks
                        ? "bg-[#BBF7D0] justify-end"
                        : "bg-gray-200 justify-start"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white border border-[#262626] shadow-sm" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐỒNG BỘ ĐÁM MÂY & DỮ LIỆU */}
          {activeTab === "data" && (
            <div className="space-y-3 text-xs">
              {/* Thẻ Đồng Bộ Đám Mây Tự Động */}
              <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                    <Cloud size={15} strokeWidth={2.2} className="text-sky-700" />
                    <span>ĐỒNG BỘ CLOUD (REALTIME):</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#262626] flex items-center gap-1.5 ${
                      user.isSignedIn
                        ? "text-emerald-900 bg-[#BBF7D0]"
                        : "text-amber-900 bg-[#FEF08A]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.isSignedIn ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                      }`}
                    />
                    {user.isSignedIn ? "Realtime Online" : "Chưa đăng nhập"}
                  </span>
                </div>

                <p className="text-xs text-[#1C1917] leading-relaxed">
                  {user.isSignedIn
                    ? `Dữ liệu đang được kết nối và đồng bộ tự động với máy chủ. Lần đồng bộ gần nhất: ${
                        lastSyncedAt || "Vừa xong"
                      }.`
                    : "Đăng nhập tài khoản để đồng bộ hóa hai chiều tức thì giữa điện thoại và máy tính không lo mất dữ liệu."}
                </p>

                {/* Tóm tắt dữ liệu hiện có trên máy */}
                {user.isSignedIn && (
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] text-[#1C1917] p-2 bg-[#FBF9F4] border border-[#D4CEBF] rounded-[4px]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckSquare size={12} strokeWidth={2.2} className="text-amber-700 shrink-0" />
                      <span>{tasks.length} công việc</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <BookOpen size={12} strokeWidth={2.2} className="text-indigo-700 shrink-0" />
                      <span>{notebooks.length} cuốn sổ</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Lightbulb size={12} strokeWidth={2.2} className="text-amber-600 shrink-0" />
                      <span>{stickyNotes.length} thẻ ý tưởng</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Flame size={12} strokeWidth={2.2} className="text-orange-600 shrink-0" />
                      <span>{habits.length} thói quen</span>
                    </span>
                  </div>
                )}

                {user.isSignedIn ? (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleCloudSync}
                    className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] font-bold flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <RefreshCw
                      size={14}
                      strokeWidth={2.2}
                      className={isSyncing ? "animate-spin" : ""}
                    />
                    <span>
                      {isSyncing ? "Đang đồng bộ đám mây..." : "Đồng bộ ngay bây giờ"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="w-full py-2 bg-[#262626] hover:bg-[#1C1917] text-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#A8A29E] font-bold flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <span>Đăng nhập / Đăng ký để bật đồng bộ ➔</span>
                  </button>
                )}
              </div>

              {/* Tùy Chọn Sao Lưu Dự Phòng */}
              <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2">
                <span className="font-bold text-[11px] text-[#1C1917] block">
                  SAO LƯU THỦ CÔNG (DỰ PHÒNG):
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="py-1.5 bg-[#FBF9F4] hover:bg-white border-[1.5px] border-[#262626] rounded-[4px] font-bold flex items-center justify-center gap-1.5 text-[11px] shadow-[1px_1px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Download size={13} strokeWidth={2.2} />
                    <span>Tải bản sao lưu</span>
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
                    className="py-1.5 bg-[#FBF9F4] hover:bg-white border-[1.5px] border-[#262626] rounded-[4px] font-bold flex items-center justify-center gap-1.5 text-[11px] shadow-[1px_1px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Upload size={13} strokeWidth={2.2} />
                    <span>Nhập từ file</span>
                  </button>
                </div>
              </div>

              {/* Nạp Dữ Liệu Mẫu */}
              <div className="p-3 bg-[#FEF08A]/40 border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#1C1917] text-[11px] flex items-center gap-1.5">
                    <Zap
                      size={14}
                      strokeWidth={2.2}
                      className="text-amber-600"
                    />
                    <span>KHÁM PHÁ NHANH ỨNG DỤNG:</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      loadSampleData();
                      showToast("✨ Đã thêm dữ liệu mẫu để bạn khám phá!");
                    }}
                    className="px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917] border border-[#262626] rounded text-[11px] font-bold shadow-[1px_1px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    Thử ngay ✦
                  </button>
                </div>
                <p className="text-[10px] text-[#78716C] leading-snug">
                  Nạp bộ dữ liệu mẫu gồm việc làm, sổ tay, ý tưởng & thói quen để tham khảo cách dùng app tốt nhất.
                </p>
              </div>

              {/* Vùng Làm Mới */}
              <div className="p-2.5 bg-red-50/70 border border-red-300 rounded-[6px] flex items-center justify-between">
                <div>
                  <p className="font-bold text-red-700 text-[11px]">
                    Đặt lại ứng dụng
                  </p>
                  <p className="text-[10px] text-red-600">
                    Xóa dữ liệu để bắt đầu lại
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="px-2.5 py-1 bg-white text-red-600 hover:bg-red-600 hover:text-white border border-red-400 rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={12} strokeWidth={2.2} />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GIỚI THIỆU */}
          {activeTab === "about" && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2 text-center">
                <div className="w-12 h-12 mx-auto bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] -rotate-2 flex items-center justify-center">
                  <Settings
                    size={24}
                    strokeWidth={2}
                    className="text-[#1C1917]"
                  />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#1C1917]">
                  SketchTask - Sổ Tay Công Việc Cá Nhân
                </h4>
                <p className="text-xs text-[#1C1917] leading-relaxed pt-1">
                  SketchTask được thiết kế như một cuốn sổ tay giấy vẽ tay ấm
                  áp, giúp bạn sắp xếp công việc mỗi ngày, rèn luyện thói quen
                  tốt và ghi lại những ý tưởng bất chợt một cách nhẹ nhàng nhất.
                </p>
              </div>
              {/* Mẹo Sử Dụng Cho Người Dùng */}
              <div className="p-3 bg-white border border-[#D4CEBF] rounded-[6px] space-y-2">
                <span className="font-bold text-[11px] text-[#1C1917] block">
                  💡 MẸO SỬ DỤNG HẰNG NGÀY:
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#1C1917] leading-relaxed list-disc list-inside">
                  <li>
                    <strong>Hôm nay:</strong> Tập trung làm những việc quan
                    trọng nhất trong ngày.
                  </li>
                  <li>
                    <strong>Kế hoạch:</strong> Xem lịch tuần/tháng và kéo việc
                    tương lai về hôm nay.
                  </li>
                  <li>
                    <strong>Sổ tay:</strong> Tạo từng cuốn sổ cho từng dự án,
                    học tập hoặc đời sống.
                  </li>
                  <li>
                    <strong>Ý tưởng:</strong> Dán những suy nghĩ thoáng qua và
                    ghim lên đầu bảng.
                  </li>
                  <li>
                    <strong>Tổng kết:</strong> Ghi nhận cảm xúc và duy trì chuỗi
                    thói quen kiên trì.
                  </li>
                </ul>
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
    </div>,
    document.body,
  );
};
