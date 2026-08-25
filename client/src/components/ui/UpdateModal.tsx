import React from "react";
import { createPortal } from "react-dom";
import { UpdateInfo, CURRENT_APP_VERSION } from "../../services/updateService";
import { Sparkles, Download, RefreshCw, X } from "lucide-react";

// ==========================================
// COMPONENT: UpdateModal (Tự Động Báo Bản Cập Nhật Mới)
// ==========================================

interface UpdateModalProps {
  updateInfo: UpdateInfo | null;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  onClose,
}) => {
  if (!updateInfo || !updateInfo.hasUpdate) return null;

  const handleApplyUpdate = () => {
    sessionStorage.setItem("sketchtask_dismissed_version", updateInfo.latestVersion);
    // Nếu có link APK hoặc web download
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
    sessionStorage.setItem("sketchtask_dismissed_version", updateInfo.latestVersion);
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
        backdropFilter: "blur(4px)",
        touchAction: "none",
      }}
      className="flex items-center justify-center p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[#FBF9F4] dark:bg-[#262626] border-[2px] border-[#262626] dark:border-[#57534E] rounded-[8px] shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col space-y-3.5 animate-in zoom-in-95 duration-200"
      >
        {/* Paper Tape Effect */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#FEF08A]/90 border-x border-[#262626]/40 rotate-1 shadow-sm pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626] dark:border-[#57534E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FEF08A] border border-[#262626] rounded-[4px] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <Sparkles size={16} className="text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1C1917] dark:text-[#FBF9F4]">
                Đã Có Bản Cập Nhật Mới!
              </h3>
              <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-mono">
                v{CURRENT_APP_VERSION} ➔ v{updateInfo.latestVersion}
              </p>
            </div>
          </div>

          {!updateInfo.isForceUpdate && (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-white p-1"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Changelog Content */}
        <div className="p-3 bg-white dark:bg-[#1C1917] border border-[#D4CEBF] dark:border-[#44403C] rounded-[6px] space-y-1 text-xs">
          <p className="font-bold text-[11px] text-[#1C1917] dark:text-[#FBF9F4]">
            ✨ Có gì mới trong bản này:
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
              className="flex-1 py-2 bg-[#F3EFE6] dark:bg-[#2E2A27] hover:bg-white dark:hover:bg-[#3D3834] border border-[#262626] dark:border-[#57534E] rounded-[4px] text-xs font-bold text-[#78716C] dark:text-[#A8A29E] transition-all"
            >
              Để sau
            </button>
          )}

          <button
            type="button"
            onClick={handleApplyUpdate}
            className="flex-1 py-2 bg-[#BBF7D0] hover:bg-[#86EFAC] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all select-none"
          >
            <RefreshCw size={13} strokeWidth={2.5} />
            <span>Cập nhật ngay</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

