import { prisma } from "../db.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export class AuthService {
  static async register(name: string, email: string, password?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.");
    }

    const passwordHash = password ? await hashPassword(password) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        avatar: "lucide:User",
        avatarBg: "#BBF7D0",
      },
    });

    const token = signToken({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "lucide:User",
        avatarBg: user.avatarBg || "#BBF7D0",
      },
    };
  }

  static async login(email: string, password?: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Không tìm thấy tài khoản với email này.");
    }

    if (user.passwordHash) {
      if (!password) {
        throw new Error("Tài khoản này yêu cầu mật khẩu để đăng nhập.");
      }
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        throw new Error("Mật khẩu không chính xác.");
      }
    }

    const token = signToken({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "lucide:User",
        avatarBg: user.avatarBg || "#BBF7D0",
      },
    };
  }

  static async googleAuth(data: {
    email: string;
    name: string;
    avatar?: string;
    avatarBg?: string;
    googleId?: string;
  }) {
    let user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          avatar: data.avatar || "lucide:Sparkles",
          avatarBg: data.avatarBg || "#FEF08A",
          googleId: data.googleId || `google_${Date.now()}`,
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "lucide:Sparkles",
        avatarBg: user.avatarBg || "#FEF08A",
      },
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        avatarBg: true,
        createdAt: true,
      },
    });

    if (!user) throw new Error("Không tìm thấy người dùng");
    return user;
  }

  static async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string; avatarBg?: string }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatar && { avatar: data.avatar }),
        ...(data.avatarBg && { avatarBg: data.avatarBg }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        avatarBg: true,
      },
    });

    return user;
  }
}

