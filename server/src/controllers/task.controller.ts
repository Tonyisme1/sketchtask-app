import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import { TaskService } from "../services/task.service.js";

export class TaskController {
  static async getTasks(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const tasks = await TaskService.getAllTasks(userId);
    res.json({ success: true, data: tasks });
  }

  static async createTask(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const newTask = await TaskService.createTask(userId, req.body);
    res.status(201).json({ success: true, data: newTask });
  }

  static async updateTask(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const updated = await TaskService.updateTask(userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }
    res.json({ success: true, data: updated });
  }

  static async deleteTask(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
    }
    const deleted = await TaskService.deleteTask(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }
    res.json({ success: true, message: "Đã xóa task thành công" });
  }
}
