import { Router } from "express";
import { HabitController } from "../controllers/habit.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(HabitController.getAll));
router.post("/", asyncHandler(HabitController.create));
router.post("/:id/log", asyncHandler(HabitController.logHabit));
router.post("/:id/toggle", asyncHandler(HabitController.toggleLog));
router.delete("/:id", asyncHandler(HabitController.delete));

export default router;
