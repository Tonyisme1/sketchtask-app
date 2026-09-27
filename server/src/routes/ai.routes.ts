import { Router } from "express";
import { AiController } from "../controllers/ai.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { authenticate } from "../middlewares/authenticate.js";

const aiRoutes = Router();
aiRoutes.use(authenticate);
aiRoutes.post("/chat", asyncHandler(AiController.chat));

export default aiRoutes;
