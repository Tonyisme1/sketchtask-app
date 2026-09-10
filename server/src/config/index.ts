import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;
const rawJwtSecret = process.env.JWT_SECRET;
const defaultSecret = "sketchtask_super_secret_jwt_key_2026";

if (!databaseUrl) {
  throw new Error(
    "FATAL: DATABASE_URL chưa được cấu hình.",
  );
}

if (isProduction && !/^file:/.test(databaseUrl)) {
  throw new Error(
    "FATAL: Trong môi trường Production, DATABASE_URL phải là đường dẫn SQLite dạng file:.",
  );
}

if (isProduction && process.env.RENDER === "true" && !/^file:\/var\/data\//.test(databaseUrl)) {
  throw new Error(
    "FATAL: Trên Render, DATABASE_URL phải trỏ vào Persistent Disk: file:/var/data/sketchtask.db.",
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

export const config = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl,
  jwtSecret: rawJwtSecret || defaultSecret,
  isProduction,
  corsOrigins: (process.env.CORS_ORIGINS || "https://sketchtask-app.vercel.app,capacitor://localhost,http://localhost")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
