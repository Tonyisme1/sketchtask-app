import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import { AdminService } from "../services/admin.service.js";

export class AdminController {
  static async getOverview(_req: AuthenticatedRequest, res: Response) {
    try {
      const data = await AdminService.getOverview();
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Không thể tải tổng quan quản trị.",
      });
    }
  }

  static async listUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const rawPage = Number(req.query.page || 1);
      const rawPageSize = Number(req.query.pageSize || 20);
      const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
      const pageSize = Number.isFinite(rawPageSize)
        ? Math.min(100, Math.max(1, Math.floor(rawPageSize)))
        : 20;
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const data = await AdminService.listUsers(search, page, pageSize);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Không thể tải danh sách người dùng.",
      });
    }
  }

  static async getUserData(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await AdminService.getUserData(req.params.userId);
      if (!data) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
      }
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Không thể tải dữ liệu người dùng.",
      });
    }
  }
}
