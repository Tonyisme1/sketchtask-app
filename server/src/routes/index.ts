import { Router } from "express";
import authRoutes from "./auth.routes.js";
import syncRoutes from "./sync.routes.js";
import taskRoutes from "./task.routes.js";
import habitRoutes from "./habit.routes.js";
import aiRoutes from "./ai.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/sync", syncRoutes);
apiRouter.use("/tasks", taskRoutes);
apiRouter.use("/habits", habitRoutes);
apiRouter.use("/ai", aiRoutes);

export default apiRouter;
