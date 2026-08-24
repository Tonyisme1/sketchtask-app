import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../db.js";
export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Yêu cầu đăng nhập để thực hiện thao tác này.",
        });
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({
            success: false,
            message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
        });
    }
    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, avatar: true, avatarBg: true },
    });
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Người dùng không tồn tại.",
        });
    }
    req.user = user;
    next();
}
