import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: config.isProduction
      ? "Đã xảy ra lỗi nội bộ hệ thống."
      : err.message || "Đã xảy ra lỗi nội bộ hệ thống.",
  });
}
