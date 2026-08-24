import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
export function signToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: "30d" });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwtSecret);
    }
    catch {
        return null;
    }
}
