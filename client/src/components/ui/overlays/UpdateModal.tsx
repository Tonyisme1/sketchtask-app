import React from "react";
import { createPortal } from "react-dom";
import { UpdateInfo, CURRENT_APP_VERSION } from "../../../services/updateService";
import { Sparkles, RefreshCw, X, ArrowRight } from "lucide-react";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { Capacitor } from "@capacitor/core";

// ==========================================
// COMPONENT: UpdateModal (Tự Động Báo Bản Cập Nhật Mới)
// ==========================================

export interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  onClose,
}) => {
  const isOpen = Boolean(updateInfo && updateInfo.hasUpdate);
  useScrollLock(isOpen);

  if (!updateInfo || !updateInfo.hasUpdate) return null;

  const handleApplyUpdate = () => {
    // APK chứa bundle dist tại thời điểm build; mở nguồn tải để người dùng
    // cài APK mới thay vì reload lại chính bundle native cũ.
    if (Capacitor.isNativePlatform()) {
      const nativeDownloadUrl = updateInfo.apkUrl || updateInfo.downloadUrl;
      if (nativeDownloadUrl) window.open(nativeDownloadUrl, "_blank");
      onClose();
      return;
    }

    localStorage.setItem("sketchtask_dismissed_version", updateInfo.latestVersion);

    // Với web/PWA, yêu cầu service worker lấy bundle mới rồi reload.
    if (updateInfo.apkUrl && updateInfo.apkUrl.endsWith(".apk")) {
      window.open(updateInfo.apkUrl, "_blank");
    } else {
      // Reload ứng dụng để tải bản Service Worker mới
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.update();
          }
        });
      }
      window.location.reload();
    }
    onClose();
  };

  const handleDismiss = () => {
    localStorage.setItem("sketchtask_dismissed_version", updateInfo.latestVersion);
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 9999999,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        touchAction: "none",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Cập nhật ứng dụng"
      className="flex items-center justify-center p-4 select-none pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-[#1E1E22] rounded-3xl shadow-2xl p-5 flex flex-col space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[var(--accent-blue)] text-white rounded-2xl flex items-center justify-center shadow-xs">
              <Sparkles size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1C1917] dark:text-[#FBF9F4]">
                Đã Có Bản Cập Nhật Mới!
              </h3>
              <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-mono">
                <span className="inline-flex items-center gap-1">
                  v{CURRENT_APP_VERSION}
                  <ArrowRight size={11} strokeWidth={2.4} />
                  v{updateInfo.latestVersion}
                </span>
              </p>
            </div>
          </div>

          {!updateInfo.isForceUpdate && (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-white p-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* Changelog Content */}
        <div className="p-3.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl space-y-1.5 text-xs">
          <p className="font-bold text-[11px] text-[#1C1917] dark:text-[#FBF9F4] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[var(--accent-blue)]" />
            <span>Có gì mới trong bản này:</span>
          </p>
          <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
            {updateInfo.changelog ||
              "Bổ sung các cải tiến hiệu năng, sửa lỗi và nâng cấp trải nghiệm người dùng."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center gap-2">
          {!updateInfo.isForceUpdate && (
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] rounded-2xl text-xs font-bold text-[#78716C] dark:text-[#A8A29E] transition-all cursor-pointer"
            >
              Để sau
            </button>
          )}

          <button
            type="button"
            onClick={handleApplyUpdate}
            className="flex-1 py-2.5 bg-[#1C1917] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#F2F2F7] dark:text-[#1C1917] rounded-2xl shadow-xs text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all select-none cursor-pointer"
          >
            <RefreshCw size={13} strokeWidth={2.5} />
            <span>{Capacitor.isNativePlatform() ? "Mở nơi tải APK" : "Cập nhật ngay"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
