import { Request, Response } from "express";
import { TaskService } from "../services/task.service.js";

export class TaskController {
  static async getTasks(_req: Request, res: Response) {
    const tasks = await TaskService.getAllTasks();
    res.json({ success: true, data: tasks });
  }

  static async createTask(req: Request, res: Response) {
    const newTask = await TaskService.createTask(req.body);
    res.status(201).json({ success: true, data: newTask });
  }

  static async updateTask(req: Request, res: Response) {
    const updated = await TaskService.updateTask(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }
    res.json({ success: true, data: updated });
  }

  static async deleteTask(req: Request, res: Response) {
    const deleted = await TaskService.deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }
    res.json({ success: true, message: "Đã xóa task thành công" });
  }
}

