import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;
const directDatabaseUrl = process.env.DIRECT_URL;
const rawJwtSecret = process.env.JWT_SECRET;
const defaultSecret = "sketchtask_super_secret_jwt_key_2026";

if (!databaseUrl) {
  throw new Error(
    "FATAL: DATABASE_URL chưa được cấu hình.",
  );
}

if (!directDatabaseUrl) {
  throw new Error(
    "FATAL: DIRECT_URL chưa được cấu hình cho Prisma migrations.",
  );
}

if (isProduction && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
  throw new Error(
    "FATAL: Trong môi trường Production, DATABASE_URL phải là connection string PostgreSQL (postgresql:// hoặc postgres://).",
  );
}

// Trong môi trường production: Bắt buộc phải có JWT_SECRET mạnh, không được để trống hoặc dùng key mặc định yếu
if (isProduction) {
  if (!rawJwtSecret || rawJwtSecret === defaultSecret || rawJwtSecret.trim().length < 16) {
    throw new Error(
      "FATAL: Trong môi trường Production, JWT_SECRET phải được cấu hình rõ ràng với độ dài tối thiểu 16 ký tự và không được dùng secret mặc định."
    );
  }
}

const resolveGeminiApiKey = () => {
  const direct =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_AI_KEY;
  if (direct && direct.trim()) return direct.trim();

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string" && key.toUpperCase().includes("GEMINI")) {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
};

export const config = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl,
  directDatabaseUrl,
  jwtSecret: rawJwtSecret || defaultSecret,
  geminiApiKey: resolveGeminiApiKey(),
  isProduction,
  corsOrigins: (process.env.CORS_ORIGINS || "https://sketchtask-app.vercel.app,capacitor://localhost,http://localhost")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
