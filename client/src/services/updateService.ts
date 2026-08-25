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

const SOURCES = [
  "https://sketchtask-app.vercel.app/version.json",
  "https://raw.githubusercontent.com/Tonyisme1/sketchtask-app/main/client/public/version.json",
  "https://sketchtask-app.onrender.com/api/version",
];

/**
 * Kiểm tra phiên bản mới nhất từ máy chủ (Vercel / GitHub Raw / Backend)
 */
export const checkForAppUpdates = async (): Promise<UpdateInfo | null> => {
  for (const url of SOURCES) {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
        cache: "no-store",
      });

      if (!res.ok) continue;

      const data = await res.json();
      const latestVersion = data.version;
      if (!latestVersion) continue;

      // So sánh version chuỗi semver (ví dụ "1.3.0" > "1.2.0")
      const hasUpdate = isNewerVersion(latestVersion, CURRENT_APP_VERSION);

      return {
        hasUpdate,
        latestVersion,
        changelog: data.changelog,
        apkUrl: data.apkUrl || "https://github.com/Tonyisme1/sketchtask-app/actions",
        downloadUrl: data.downloadUrl || "https://sketchtask-app.vercel.app",
        isForceUpdate: !!data.isForceUpdate,
      };
    } catch (e) {
      // Thử nguồn tiếp theo
      continue;
    }
  }

  return null;
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

