import { Router } from "express";
import { SyncController } from "../controllers/sync.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const syncRoutes = Router();

// Toàn bộ sync endpoints đều yêu cầu Bearer JWT token
syncRoutes.use(authenticate);

syncRoutes.get("/pull", SyncController.pullData);
syncRoutes.post("/push", SyncController.pushData);

export default syncRoutes;

