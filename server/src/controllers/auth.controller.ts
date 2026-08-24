import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: "Tên và email là bắt buộc.",
        });
      }

      const result = await AuthService.register(name, email, password);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "Lỗi đăng ký tài khoản.",
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email là bắt buộc.",
        });
      }

      const result = await AuthService.login(email, password);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "Lỗi đăng nhập.",
      });
    }
  }

  static async googleAuth(req: Request, res: Response) {
    try {
      const { email, name, avatar, avatarBg, googleId } = req.body;
      if (!email || !name) {
        return res.status(400).json({
          success: false,
          message: "Email và tên là bắt buộc.",
        });
      }

      const result = await AuthService.googleAuth({
        email,
        name,
        avatar,
        avatarBg,
        googleId,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "Lỗi xác thực Google.",
      });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
      }
      const user = await AuthService.getMe(req.user.id);
      return res.json({ success: true, data: user });
    } catch (err: any) {
      return res.status(404).json({ success: false, message: err.message });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
      }
      const updated = await AuthService.updateProfile(req.user.id, req.body);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

