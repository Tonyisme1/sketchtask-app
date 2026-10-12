import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import { AiService } from "../services/ai.service.js";

const isChatMessage = (value: unknown): value is { sender: "user" | "ai"; text: string } => {
  if (!value || typeof value !== "object") return false;
  const message = value as { sender?: unknown; text?: unknown };
  return (message.sender === "user" || message.sender === "ai") && typeof message.text === "string";
};

export class AiController {
  static async chat(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập tài khoản để sử dụng Trợ lý AI.",
      });
    }
    const query = typeof req.body?.query === "string" ? req.body.query : "";
    const history = Array.isArray(req.body?.history) ? req.body.history.filter(isChatMessage) : [];
    try {
      const data = await AiService.reply(req.user.id, query, history);
      return res.json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi xử lý yêu cầu AI.";
      console.error("[AiController] chat error:", message);
      return res.status(500).json({ success: false, message });
    }
  }
}
