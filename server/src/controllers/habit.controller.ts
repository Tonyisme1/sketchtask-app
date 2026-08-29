import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import { HabitService } from "../services/habit.service.js";

export class HabitController {
  static async getAll(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const habits = await HabitService.getAll(userId);
    res.json({ success: true, data: habits });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const habit = await HabitService.create(userId, req.body);
    res.status(201).json({ success: true, data: habit });
  }

  static async logHabit(req: AuthenticatedRequest, res: Response) {
    return HabitController.toggleLog(req, res);
  }

  static async toggleLog(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: "Thiếu trường date (YYYY-MM-DD)" });
    }
    const habit = await HabitService.toggleLog(userId, req.params.id, date);
    if (!habit) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thói quen" });
    }
    res.json({ success: true, data: habit });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const deleted = await HabitService.delete(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thói quen" });
    }
    res.json({ success: true, message: "Đã xóa thói quen thành công" });
  }
}
