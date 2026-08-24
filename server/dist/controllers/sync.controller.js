import { SyncService } from "../services/sync.service.js";
export class SyncController {
    static async pullData(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
            }
            const data = await SyncService.getUserData(req.user.id);
            return res.json({
                success: true,
                data,
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message || "Lỗi tải dữ liệu đồng bộ.",
            });
        }
    }
    static async pushData(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
            }
            const syncedData = await SyncService.syncData(req.user.id, req.body);
            return res.json({
                success: true,
                message: "Đồng bộ đám mây thành công!",
                data: syncedData,
            });
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message || "Lỗi đồng bộ dữ liệu lên máy chủ.",
            });
        }
    }
}
