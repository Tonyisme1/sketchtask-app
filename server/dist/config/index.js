import dotenv from "dotenv";
dotenv.config();
export const config = {
    port: Number(process.env.PORT) || 5000,
    databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
    jwtSecret: process.env.JWT_SECRET || "sketchtask_super_secret_jwt_key_2026",
    isProduction: process.env.NODE_ENV === "production",
};
