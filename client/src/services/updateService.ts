// ==========================================
// SERVICE: updateService.ts (Tự Động Kiểm Tra Cập Nhật)
// ==========================================

export const CURRENT_APP_VERSION = "1.3.0";

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  changelog?: string;
  apkUrl?: string;
  downloadUrl?: string;
  isForceUpdate?: boolean;
}

const VERCEL_VERSION_URL =
  "https://sketchtask-app.vercel.app/version.json";

/**
 * Kiểm tra phiên bản mới nhất từ máy chủ (Vercel / Backend)
 */
export const checkForAppUpdates = async (): Promise<UpdateInfo | null> => {
  try {
    // 1. Ưu tiên fetch từ Vercel CDN tĩnh siêu nhanh (kèm cache-buster)
    const res = await fetch(`${VERCEL_VERSION_URL}?t=${Date.now()}`, {
      method: "GET",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    const latestVersion = data.version || CURRENT_APP_VERSION;

    // Kiểm tra xem người dùng đã bỏ qua hoặc đã cập nhật version này trong session chưa
    const dismissedVersion = sessionStorage.getItem("sketchtask_dismissed_version");
    if (dismissedVersion === latestVersion) {
      return null;
    }

    // So sánh version chuỗi semver (ví dụ "1.3.1" > "1.3.0")
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

