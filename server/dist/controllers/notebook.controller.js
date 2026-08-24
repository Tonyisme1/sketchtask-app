import { NotebookService } from "../services/notebook.service.js";
export class NotebookController {
    static async getAll(_req, res) {
        const notebooks = await NotebookService.getAll();
        res.json({ success: true, data: notebooks });
    }
    static async create(req, res) {
        const notebook = await NotebookService.create(req.body);
        res.status(201).json({ success: true, data: notebook });
    }
    static async update(req, res) {
        const updated = await NotebookService.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, message: "Không tìm thấy cuốn sổ" });
        }
        res.json({ success: true, data: updated });
    }
}
