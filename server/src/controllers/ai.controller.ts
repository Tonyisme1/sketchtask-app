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
    if (!req.user) return res.status(401).json({ success: false, message: "Chưa đăng nhập." });
    const query = typeof req.body?.query === "string" ? req.body.query : "";
    const history = Array.isArray(req.body?.history) ? req.body.history.filter(isChatMessage) : [];
    const data = await AiService.reply(req.user.id, query, history);
    return res.json({ success: true, data });
  }
}
