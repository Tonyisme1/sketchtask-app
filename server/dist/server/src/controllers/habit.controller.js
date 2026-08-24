import { HabitService } from "../services/habit.service.js";
export class HabitController {
    static async getAll(_req, res) {
        const habits = await HabitService.getAll();
        res.json({ success: true, data: habits });
    }
    static async create(req, res) {
        const habit = await HabitService.create(req.body);
        res.status(201).json({ success: true, data: habit });
    }
    static async toggleLog(req, res) {
        const { date } = req.body;
        if (!date) {
            return res.status(400).json({ success: false, message: "Thiếu trường date (YYYY-MM-DD)" });
        }
        const habit = await HabitService.toggleLog(req.params.id, date);
        if (!habit) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thói quen" });
        }
        res.json({ success: true, data: habit });
    }
}
