// ==========================================
// CẤU HÌNH API KEY TRỢ LÝ AI (GOOGLE GEMINI)
// Tích hợp ngầm key sẵn cho toàn bộ người dùng
// ==========================================

export const AI_CONFIG = {
  // Key mặc định tích hợp sẵn
  DEFAULT_GEMINI_API_KEY:
    import.meta.env.VITE_GEMINI_API_KEY ||
    "",

  // Danh sách các model tốc độ cao hoạt động ổn định nhất
  FALLBACK_MODELS: [
    "gemini-3-flash-preview",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite-preview",
  ],

  DEFAULT_MODEL: "gemini-3-flash-preview",

  // Base API URL của Google Gemini
  BASE_URL: "https://generativelanguage.googleapis.com/v1beta",
};

export function getEffectiveGeminiApiKey(): string {
  try {
    const localKey = localStorage.getItem("sketchtask_gemini_api_key");
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  } catch {
    // ignore
  }

  return (AI_CONFIG.DEFAULT_GEMINI_API_KEY || "").trim();
}

export function setEffectiveGeminiApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem("sketchtask_gemini_api_key", key.trim());
    } else {
      localStorage.removeItem("sketchtask_gemini_api_key");
    }
  } catch {
    // ignore
  }
}
