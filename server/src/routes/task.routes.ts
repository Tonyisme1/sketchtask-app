import { Router } from "express";
import { TaskController } from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(TaskController.getTasks));
router.post("/", asyncHandler(TaskController.createTask));
router.patch("/:id", asyncHandler(TaskController.updateTask));
router.delete("/:id", asyncHandler(TaskController.deleteTask));

export default router;
