// ==========================================
// CẤU HÌNH API KEY TRỢ LÝ AI (GOOGLE GEMINI)
// Bạn có thể dán API Key trực tiếp vào DEFAULT_GEMINI_API_KEY bên dưới
// hoặc cấu hình trong file .env với biến VITE_GEMINI_API_KEY
// ==========================================

export const AI_CONFIG = {
  // Dán Google Gemini API Key vào đây (hoặc lấy từ import.meta.env):
  DEFAULT_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || "",

  // Model khuyến nghị: gemini-1.5-flash (tốc độ cao, miễn phí, tiếng Việt chuẩn)
  DEFAULT_MODEL: "gemini-1.5-flash",

  // Base API URL của Google Gemini
  BASE_URL: "https://generativelanguage.googleapis.com/v1beta",
};

export function getEffectiveGeminiApiKey(): string {
  // 1. Ưu tiên key lưu trong LocalStorage nếu có
  try {
    const localKey = localStorage.getItem("sketchtask_gemini_api_key");
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  } catch {
    // ignore
  }

  // 2. Key từ cấu hình hoặc file .env
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
