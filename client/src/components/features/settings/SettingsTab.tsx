import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { ConfirmModal } from "../../ui";
import { CURRENT_APP_VERSION } from "../../../services/updateService";
import { notificationService } from "../../../services/notificationService";
import { sounds } from "../../../utils/soundEffects";
import { PinLockModal } from "../auth/PinLockModal";
import { TabKey } from "../../../types";
import {
  Settings as SettingsIcon,
  UserCheck,
  Globe,
  Bell,
  Database,
  Info,
  ChevronRight,
  Lock,
  Volume2,
  FileText,
  Cloud,
  RefreshCw,
  Download,
  Upload,
  Archive,
  Zap,
  Trash2,
  Keyboard,
  ShieldCheck,
  Sparkles,
  Pencil,
  ArrowLeft,
  ExternalLink,
  Compass,
} from "lucide-react";

// ==========================================
// COMPONENT: SettingsTab (Chuẩn YouTube Fullscreen Settings Tinh Gọn)
// ==========================================

interface SettingsTabProps {
  onNavigateTab?: (tab: TabKey) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenAuth?: () => void;
  onOpenIntro?: () => void;
  previousTab?: TabKey;
}

type SubViewType = "general" | "backup" | "shortcuts" | "privacy" | "about" | null;

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onNavigateTab,
  onNavigateRoute,
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
    openAuthModal,
  } = useAppStore();

  const [activeSubView, setActiveSubView] = useState<SubViewType>(null);
  const [isReturningFromSubView, setIsReturningFromSubView] = useState(false);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"setup" | "change" | "disable" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [permStatus, setPermStatus] = useState<"granted" | "denied" | "default">("default");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openSubView = (view: Exclude<SubViewType, null>) => {
    setIsReturningFromSubView(false);
    setActiveSubView(view);
  };

  const closeSubView = () => {
    setIsReturningFromSubView(true);
    setActiveSubView(null);
    window.setTimeout(() => setIsReturningFromSubView(false), 220);
  };

  useEffect(() => {
    notificationService.getPermissionStatus().then(setPermStatus);
  }, []);

  const storageHealth = useMemo(() => {
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sketchtask")) {
          const val = localStorage.getItem(key) || "";
          totalBytes += key.length + val.length * 2;
        }
      }
    } catch {
      totalBytes = 10240;
    }
    const kb = (totalBytes / 1024).toFixed(1);
    const maxKb = 5120;
    const percent = Math.min(100, Math.round((totalBytes / (maxKb * 1024)) * 100));
    return { kb, percent };
  }, [tasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCloudSync = async () => {
    if (!user.isSignedIn) {
      if (onOpenAuth) onOpenAuth();
      else openAuthModal();
      return;
    }
    setIsSyncing(true);
    const success = await syncNow();
    setIsSyncing(false);
    showToast(success ? "Đã đồng bộ thành công!" : "Lỗi kết nối máy chủ");
  };

  const handleExportData = () => {
    try {
      const dump: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sketchtask")) {
          dump[key] = localStorage.getItem(key);
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sketchtask_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    showToast("Đã tải về file sao lưu JSON!");
    } catch {
      showToast("Lỗi khi xuất file sao lưu.");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === "object" && parsed !== null) {
          Object.keys(parsed).forEach((k) => {
            if (k.startsWith("sketchtask")) {
              localStorage.setItem(k, parsed[k]);
            }
          });
    showToast("Phục hồi thành công! Đang làm mới...");
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast("File không đúng định dạng!");
        }
      } catch {
        showToast("Lỗi khi đọc file sao lưu!");
      }
    };
    reader.readAsText(file);
  };

  const handlePerformArchive = () => {
    const count = archiveOldTasks(60);
    setConfirmArchiveOpen(false);
    if (count > 0) {
    showToast(`Đã dọn ${count} việc hoàn thành.`);
    } else {
      showToast("Không có việc hoàn thành quá 60 ngày.");
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    showToast("Đã đặt lại ứng dụng!");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // =========================================================================
  // RENDER TRANG CON FULLSCREEN (SUB-VIEWS - KHÔNG BỊ TRÙNG HEADER)
  // =========================================================================

  // 1. Sub-view: CHUNG
  if (activeSubView === "general") {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBF9F4] overflow-y-auto px-3.5 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] pb-24 select-none mobile-panel-enter flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#262626]/20">
            <button
              type="button"
              onClick={closeSubView}
              className="p-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
            <h1 className="text-base sm:text-lg font-black text-[#1C1917] truncate">
              Chung
            </h1>
          </div>

          {/* Nền giấy */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 shadow-[2px_2px_0px_#262626] space-y-3">
            <p className="text-xs font-bold text-[#1C1917] uppercase font-mono flex items-center gap-1.5">
              <FileText size={15} strokeWidth={2.4} />
              <span>Chất liệu giấy</span>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {[
                { key: "blank", label: "Giấy Trơn" },
                { key: "lined", label: "Kẻ Ngang" },
                { key: "dots", label: "Chấm Bi" },
                { key: "grid", label: "Ô Ly" },
              ].map((style) => (
                <button
                  key={style.key}
                  type="button"
                  onClick={() => {
                    setPaperStyle(style.key as any);
                    showToast(`Đã chọn ${style.label}`);
                  }}
                  className={`p-3 rounded-[6px] border text-center font-bold cursor-pointer transition-all ${
                    paperStyle === style.key
                      ? "bg-[#FEF08A] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917]"
                      : "bg-[#FAF8F3] border-[#D4CEBF] text-[#78716C] hover:border-[#262626]"
                  }`}
                >
                  <p className="text-xs">{style.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tùy biến */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 shadow-[2px_2px_0px_#262626] space-y-3.5 divide-y divide-[#E7E5E4]">
            <div className="flex items-center justify-between">
              <p className="font-bold text-xs text-[#1C1917]">Nghiêng giấy 3D</p>
              <button
                type="button"
                onClick={() => setIsTiltEnabled(!isTiltEnabled)}
                className={`w-13 h-6.5 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] cursor-pointer transition-all shrink-0 ${
                  isTiltEnabled ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                }`}
              >
                <span className="h-4.5 px-1 rounded-[2px] border border-[#262626] bg-white text-[8.5px] font-mono font-bold">
                  {isTiltEnabled ? "BẬT" : "TẮT"}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <p className="font-bold text-xs text-[#1C1917]">Ẩn việc đã xong</p>
              <button
                type="button"
                onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
                className={`w-13 h-6.5 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] cursor-pointer transition-all shrink-0 ${
                  hideCompletedTasks ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                }`}
              >
                <span className="h-4.5 px-1 rounded-[2px] border border-[#262626] bg-white text-[8.5px] font-mono font-bold">
                  {hideCompletedTasks ? "BẬT" : "TẮT"}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <p className="font-bold text-xs text-[#1C1917]">Chế độ tối</p>
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-13 h-6.5 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] cursor-pointer transition-all shrink-0 ${
                  isDarkMode ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                }`}
              >
                <span className="h-4.5 px-1 rounded-[2px] border border-[#262626] bg-white text-[8.5px] font-mono font-bold">
                  {isDarkMode ? "BẬT" : "TẮT"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Sub-view: SAO LƯU & KHÔI PHỤC
  if (activeSubView === "backup") {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBF9F4] overflow-y-auto px-3.5 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] pb-24 select-none mobile-panel-enter flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#262626]/20">
            <button
              type="button"
              onClick={closeSubView}
              className="p-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
            <h1 className="text-base sm:text-lg font-black text-[#1C1917] truncate">
              Sao lưu & khôi phục
            </h1>
          </div>

          {/* Dung lượng */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 shadow-[2px_2px_0px_#262626] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-[#1C1917] uppercase">Dung lượng:</span>
              <span className="bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#262626]">
                {storageHealth.kb} KB / 5 MB
              </span>
            </div>

            <div className="w-full h-2.5 bg-[#F3EFE6] border border-[#262626] rounded-[3px] overflow-hidden">
              <div
                className="h-full bg-[#BBF7D0] border-r border-[#262626]"
                style={{ width: `${Math.max(2, storageHealth.percent)}%` }}
              />
            </div>
          </div>

          {/* Thao tác */}
          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 shadow-[2px_2px_0px_#262626] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportData}
                className="py-3 bg-[#FAF8F3] hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] font-bold text-xs flex items-center justify-center gap-2 shadow-[1.5px_1.5px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
              >
                <Download size={15} strokeWidth={2.2} />
                <span>Xuất file JSON</span>
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
                className="py-3 bg-[#FAF8F3] hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] font-bold text-xs flex items-center justify-center gap-2 shadow-[1.5px_1.5px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
              >
                <Upload size={15} strokeWidth={2.2} />
                <span>Nạp file JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Sub-view: PHÍM TẮT
  if (activeSubView === "shortcuts") {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBF9F4] overflow-y-auto px-3.5 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] pb-24 select-none mobile-panel-enter flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#262626]/20">
            <button
              type="button"
              onClick={closeSubView}
              className="p-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
            <h1 className="text-base sm:text-lg font-black text-[#1C1917] truncate">
              Phím tắt
            </h1>
          </div>

          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 shadow-[2px_2px_0px_#262626] space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 bg-[#FAF8F3] border border-[#E7E5E4] rounded-[6px]">
              <span className="text-[#57534E]">Đóng/Mở menu bên:</span>
              <kbd className="px-2 py-1 bg-white border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-bold">Ctrl + B</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#FAF8F3] border border-[#E7E5E4] rounded-[6px]">
              <span className="text-[#57534E]">Lật ngày Nhật ký:</span>
              <kbd className="px-2 py-1 bg-white border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-bold">← / →</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#FAF8F3] border border-[#E7E5E4] rounded-[6px]">
              <span className="text-[#57534E]">Thêm dòng nhật ký:</span>
              <kbd className="px-2 py-1 bg-white border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-bold">Enter</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#FAF8F3] border border-[#E7E5E4] rounded-[6px]">
              <span className="text-[#57534E]">Đồng bộ dữ liệu:</span>
              <kbd className="px-2 py-1 bg-white border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-bold">Tự động</kbd>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Sub-view: QUYỀN RIÊNG TƯ
  if (activeSubView === "privacy") {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBF9F4] overflow-y-auto px-3.5 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] pb-24 select-none mobile-panel-enter flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#262626]/20">
            <button
              type="button"
              onClick={closeSubView}
              className="p-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
            <h1 className="text-base sm:text-lg font-black text-[#1C1917] truncate">
              Quyền riêng tư
            </h1>
          </div>

          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4 text-xs text-[#1C1917] leading-relaxed">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-700" />
                <span>1. Offline-First:</span>
              </h4>
              <p className="text-[#78716C] pl-5">
                Dữ liệu lưu trữ trực tiếp trên thiết bị của bạn.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#E7E5E4]">
              <h4 className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                <Cloud size={16} className="text-sky-700" />
                <span>2. Đồng bộ an toàn:</span>
              </h4>
              <p className="text-[#78716C] pl-5">
                Mã hóa bảo mật qua HTTPS khi đăng nhập.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#E7E5E4]">
              <h4 className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                <Lock size={16} className="text-amber-700" />
                <span>3. Không chia sẻ bên thứ ba:</span>
              </h4>
              <p className="text-[#78716C] pl-5">
                Tuyệt đối không thu thập hoặc bán thông tin cá nhân.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Sub-view: GIỚI THIỆU
  if (activeSubView === "about") {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBF9F4] overflow-y-auto px-3.5 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] pb-24 select-none mobile-panel-enter flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#262626]/20">
            <button
              type="button"
              onClick={closeSubView}
              className="p-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
            <h1 className="text-base sm:text-lg font-black text-[#1C1917] truncate">
              Giới thiệu
            </h1>
          </div>

          <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-6 shadow-[2px_2px_0px_#262626] text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[12px] shadow-[2px_2px_0px_#262626] flex items-center justify-center text-3xl font-black -rotate-1">
              <Pencil size={27} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="font-black text-lg text-[#1C1917]">
                SketchTask
              </h2>
              <p className="text-xs text-[#78716C] font-mono mt-0.5">
                Phiên bản: <strong className="text-[#1C1917]">v{CURRENT_APP_VERSION}</strong>
              </p>
            </div>

            <p className="text-[10px] text-[#A8A29E] font-mono pt-2 border-t border-[#E7E5E4]">
              © 2026 SketchTask App
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN SETTINGS LIST VIEW (CHUẨN YOUTUBE LIST - TINH GỌN NGẮN GỌN)
  // =========================================================================
  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 pb-24 pt-1 select-none ${isReturningFromSubView ? "mobile-panel-back-enter" : "mobile-tab-enter"}`}>
      
      {/* ========================================================================= */}
      {/* NHÃN: TÀI KHOẢN                                                           */}
      {/* ========================================================================= */}
      <section className="space-y-1">
        <h2 className="text-xs font-black text-[#1C1917]/70 uppercase tracking-wider font-mono px-3 py-1">
          Tài khoản
        </h2>

        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] divide-y divide-[#E7E5E4] overflow-hidden">
          
          {/* 1. Chung */}
          <button
            type="button"
            onClick={() => openSubView("general")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <SettingsIcon size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Chung</p>
            </div>
            <ChevronRight size={17} strokeWidth={2.4} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0 ml-2" />
          </button>

          {/* 2. Tài khoản */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAuth) onOpenAuth();
              else openAuthModal();
            }}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <UserCheck size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">
                Tài khoản
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800 bg-[#FEF08A] px-2 py-0.5 rounded border border-[#262626] shrink-0 ml-2">
              {user.isSignedIn ? "Đổi" : "Đăng nhập"}
            </span>
          </button>

          {/* 3. Mã PIN bảo mật */}
          <button
            type="button"
            onClick={() => setPinModalMode(pinCode ? "change" : "setup")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Lock size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Mã PIN bảo mật</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#262626] ${
                pinCode ? "bg-[#BBF7D0] text-emerald-950" : "bg-stone-100 text-stone-600"
              }`}>
                {pinCode ? "Đang bật" : "Tắt"}
              </span>
              <ChevronRight size={17} strokeWidth={2.4} className="text-[#A8A29E] group-hover:text-[#1C1917]" />
            </div>
          </button>

          {/* 4. Thông báo */}
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <Bell size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Thông báo</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!isNotificationsEnabled) {
                  const granted = await notificationService.requestPermission();
                  setPermStatus(granted ? "granted" : "denied");
                  setIsNotificationsEnabled(granted);
                  if (granted) showToast("Đã bật thông báo!");
                  else showToast("Chưa được cấp quyền.");
                } else {
                  setIsNotificationsEnabled(false);
                  showToast("Đã tắt thông báo.");
                }
              }}
              className={`w-13 h-6.5 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] cursor-pointer transition-all shrink-0 ${
                isNotificationsEnabled ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
              }`}
            >
              <span className="h-4.5 px-1 rounded-[2px] border border-[#262626] bg-white text-[9px] font-mono font-bold">
                {isNotificationsEnabled ? "BẬT" : "TẮT"}
              </span>
            </button>
          </div>

          {/* 5. Âm thanh */}
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <Volume2 size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Âm thanh</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSoundEnabled && (
                <button
                  type="button"
                  onClick={() => sounds.playPencilCheck(soundVolume)}
                  className="px-2 py-0.5 bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] rounded text-[10px] font-bold shadow-[1px_1px_0px_#262626] cursor-pointer"
                >
                  Thử
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSoundEnabled(!isSoundEnabled);
                  if (!isSoundEnabled) sounds.playPencilCheck(soundVolume);
                }}
                className={`w-13 h-6.5 border-[1.5px] border-[#262626] rounded-[4px] p-0.5 flex items-center shadow-[1px_1px_0px_#262626] cursor-pointer transition-all ${
                  isSoundEnabled ? "bg-[#BBF7D0] justify-end" : "bg-[#F3EFE6] justify-start"
                }`}
              >
                <span className="h-4.5 px-1 rounded-[2px] border border-[#262626] bg-white text-[9px] font-mono font-bold">
                  {isSoundEnabled ? "BẬT" : "TẮT"}
                </span>
              </button>
            </div>
          </div>

          {/* 6. Ngôn ngữ */}
          <div className="px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <Globe size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Ngôn ngữ</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1C1917] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#262626] shrink-0 ml-2">
              🇻🇳 Tiếng Việt
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* NHÃN: DỮ LIỆU & BỘ NHỚ                                                    */}
      {/* ========================================================================= */}
      <section className="space-y-1">
        <h2 className="text-xs font-black text-[#1C1917]/70 uppercase tracking-wider font-mono px-3 py-1">
          Dữ liệu & Bộ nhớ
        </h2>

        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] divide-y divide-[#E7E5E4] overflow-hidden">
          
          {/* 7. Đồng bộ đám mây */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleCloudSync}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Cloud size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Đồng bộ đám mây</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-[#262626] ${
                user.isSignedIn ? "bg-[#BBF7D0] text-emerald-950" : "bg-[#FEF08A] text-amber-950"
              }`}>
                {isSyncing ? "Đang đồng bộ..." : user.isSignedIn ? "Đồng bộ ngay" : "Đăng nhập"}
              </span>
              <RefreshCw size={14} className={isSyncing ? "animate-spin text-emerald-800" : "text-[#A8A29E]"} />
            </div>
          </button>

          {/* 8. Sao lưu & khôi phục */}
          <button
            type="button"
            onClick={() => openSubView("backup")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Database size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Sao lưu & khôi phục</p>
            </div>
            <ChevronRight size={17} strokeWidth={2.4} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0 ml-2" />
          </button>

          {/* 9. Dọn dẹp việc cũ */}
          <button
            type="button"
            onClick={() => setConfirmArchiveOpen(true)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Archive size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Dọn dẹp việc cũ</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1C1917] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#262626] shrink-0 ml-2">
              Dọn việc
            </span>
          </button>

          {/* 10. Dữ liệu mẫu */}
          <button
            type="button"
            onClick={() => {
              loadSampleData();
              showToast("Đã nạp dữ liệu mẫu!");
            }}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Zap size={19} strokeWidth={2.2} className="text-amber-700 shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Dữ liệu mẫu</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900 bg-[#FEF08A] px-2 py-0.5 rounded border border-[#262626] shrink-0 ml-2">
              Nạp ngay
            </span>
          </button>

          {/* 11. Đặt lại ứng dụng */}
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-rose-50 active:bg-rose-100 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Trash2 size={19} strokeWidth={2.2} className="text-rose-700 shrink-0" />
              <p className="text-sm font-bold text-rose-800 leading-tight truncate">Đặt lại ứng dụng</p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-300 shrink-0 ml-2">
              Xóa sạch
            </span>
          </button>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* NHÃN: TRỢ GIÚP & CHÍNH SÁCH                                               */}
      {/* ========================================================================= */}
      <section className="space-y-1">
        <h2 className="text-xs font-black text-[#1C1917]/70 uppercase tracking-wider font-mono px-3 py-1">
          Trợ giúp & Chính sách
        </h2>

        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] divide-y divide-[#E7E5E4] overflow-hidden">
          
          {/* 12. Hướng dẫn sử dụng */}
          {onOpenIntro && (
            <button
              type="button"
              onClick={onOpenIntro}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Sparkles size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
                <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Hướng dẫn sử dụng</p>
              </div>
              <ChevronRight size={17} strokeWidth={2.4} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0 ml-2" />
            </button>
          )}

          {/* 13. Phím tắt */}
          <button
            type="button"
            onClick={() => openSubView("shortcuts")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Keyboard size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Phím tắt</p>
            </div>
            <ChevronRight size={17} strokeWidth={2.4} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0 ml-2" />
          </button>

          {/* 14. Trang chủ */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateRoute) onNavigateRoute("/");
              else window.location.href = "/";
            }}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Compass size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Trang chủ</p>
            </div>
            <ExternalLink size={15} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0 ml-2" />
          </button>

          {/* 15. Quyền riêng tư */}
          <button
            type="button"
            onClick={() => openSubView("privacy")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <ShieldCheck size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Quyền riêng tư</p>
            </div>
            <ChevronRight size={17} strokeWidth={2.4} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0 ml-2" />
          </button>

          {/* 16. Giới thiệu */}
          <button
            type="button"
            onClick={() => openSubView("about")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] active:bg-[#F5F5F4] transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Info size={19} strokeWidth={2.2} className="text-[#1C1917] shrink-0" />
              <p className="text-sm font-bold text-[#1C1917] leading-tight truncate">Giới thiệu</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1C1917] bg-[#FEF08A] px-2 py-0.5 rounded border border-[#262626] shrink-0 ml-2">
              v{CURRENT_APP_VERSION}
            </span>
          </button>

        </div>
      </section>

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 px-3.5 py-2 bg-[#262626] text-white text-xs font-bold rounded-[4px] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] mobile-toast-enter z-50">
          {toastMessage}
        </div>
      )}

      {/* Modal Xác Nhận Reset */}
      <ConfirmModal
        isOpen={confirmResetOpen}
        title="Đặt lại toàn bộ ứng dụng"
        message="Hành động này sẽ xóa sạch dữ liệu trên thiết bị này và đưa ứng dụng về trạng thái ban đầu. Bạn có chắc chắn không?"
        confirmText="Đồng ý xóa"
        onConfirm={handleResetData}
        onCancel={() => setConfirmResetOpen(false)}
      />

      {/* Modal Xác Nhận Lưu Trữ Việc Cũ */}
      <ConfirmModal
        isOpen={confirmArchiveOpen}
        title="Lưu trữ & dọn dẹp việc cũ"
        message="Các công việc đã hoàn thành cách đây hơn 60 ngày sẽ được dọn sạch khỏi danh sách chính. Bạn có muốn tiếp tục?"
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
              showToast("Đã thiết lập mã PIN bảo vệ thành công!");
            } else if (pinModalMode === "change" && newPin) {
              setPinCode(newPin);
              setPinModalMode(null);
              showToast("Đã đổi mã PIN thành công!");
            } else if (pinModalMode === "disable") {
              setPinCode(null);
              setPinModalMode(null);
              showToast("Đã tắt khóa mã PIN!");
            }
          }}
          onCancel={() => setPinModalMode(null)}
        />
      )}
    </div>
  );
};
