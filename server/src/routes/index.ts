import { Router } from "express";
import authRoutes from "./auth.routes.js";
import syncRoutes from "./sync.routes.js";
import taskRoutes from "./task.routes.js";
import notebookRoutes from "./notebook.routes.js";
import habitRoutes from "./habit.routes.js";
import adminRoutes from "./admin.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/sync", syncRoutes);
apiRouter.use("/tasks", taskRoutes);
apiRouter.use("/notebooks", notebookRoutes);
apiRouter.use("/habits", habitRoutes);
apiRouter.use("/admin", adminRoutes);

export default apiRouter;
