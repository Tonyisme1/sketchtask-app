import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import { NotebookService } from "../services/notebook.service.js";

export class NotebookController {
  static async getAll(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const notebooks = await NotebookService.getAll(userId);
    res.json({ success: true, data: notebooks });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const notebook = await NotebookService.create(userId, req.body);
    res.status(201).json({ success: true, data: notebook });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const updated = await NotebookService.update(userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuốn sổ" });
    }
    res.json({ success: true, data: updated });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const deleted = await NotebookService.delete(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuốn sổ" });
    }
    res.json({ success: true, message: "Đã xóa cuốn sổ thành công" });
  }
}
