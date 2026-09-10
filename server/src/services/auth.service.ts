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

  static async googleAuth(accessToken: string) {
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
    });

    if (!profileResponse.ok) {
      throw new Error("Google access token không hợp lệ hoặc đã hết hạn.");
    }

    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error("Tài khoản Google chưa xác minh email.");
    }

    const cleanEmail = profile.email.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: profile.name?.trim() || cleanEmail.split("@")[0],
          avatar: profile.picture || "lucide:Sparkles",
          avatarBg: "#FEF08A",
          googleId: profile.sub,
        },
      });
    } else {
      // Only bind the verified Google subject to the matching email account.
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.sub },
        });
      }
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
