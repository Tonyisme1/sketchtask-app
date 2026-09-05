import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate.js";
import { config } from "../config/index.js";

/** Authorizes admin APIs without exposing an admin flag to the browser. */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const email = req.user?.email?.trim().toLowerCase();

  if (!email || !config.adminEmails.has(email)) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập khu vực quản trị.",
    });
  }

  next();
}
