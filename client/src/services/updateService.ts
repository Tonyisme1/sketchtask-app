// ==========================================
// SERVICE: updateService.ts (Tự Động Kiểm Tra Cập Nhật)
// ==========================================

export const CURRENT_APP_VERSION = "1.2.0";

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  changelog?: string;
  apkUrl?: string;
  downloadUrl?: string;
  isForceUpdate?: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://sketchtask-app.onrender.com";

/**
 * Kiểm tra phiên bản mới nhất từ máy chủ
 */
export const checkForAppUpdates = async (): Promise<UpdateInfo | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/version`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    const latestVersion = data.version || CURRENT_APP_VERSION;

    // So sánh version chuỗi semver đơn giản
    const hasUpdate = isNewerVersion(latestVersion, CURRENT_APP_VERSION);

    return {
      hasUpdate,
      latestVersion,
      changelog: data.changelog,
      apkUrl: data.apkUrl,
      downloadUrl: data.downloadUrl,
      isForceUpdate: !!data.isForceUpdate,
    };
  } catch (error) {
    console.log("Update check skipped (offline or network error)");
    return null;
  }
};

/**
 * So sánh 2 chuỗi version ví dụ "1.2.1" > "1.2.0"
 */
function isNewerVersion(remote: string, local: string): boolean {
  const rParts = remote.replace(/[^0-9.]/g, "").split(".").map(Number);
  const lParts = local.replace(/[^0-9.]/g, "").split(".").map(Number);

  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}
