import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/overview", AdminController.getOverview);
router.get("/users", AdminController.listUsers);
router.get("/users/:userId/data", AdminController.getUserData);

export default router;
