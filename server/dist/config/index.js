import dotenv from "dotenv";
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";
const rawJwtSecret = process.env.JWT_SECRET;
const defaultSecret = "sketchtask_super_secret_jwt_key_2026";
// Trong môi trường production: Bắt buộc phải có JWT_SECRET mạnh, không được để trống hoặc dùng key mặc định yếu
if (isProduction) {
    if (!rawJwtSecret || rawJwtSecret === defaultSecret || rawJwtSecret.trim().length < 16) {
        throw new Error("FATAL: Trong môi trường Production, JWT_SECRET phải được cấu hình rõ ràng với độ dài tối thiểu 16 ký tự và không được dùng secret mặc định.");
    }
}
export const config = {
    port: Number(process.env.PORT) || 5000,
    databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
    jwtSecret: rawJwtSecret || defaultSecret,
    isProduction,
};
