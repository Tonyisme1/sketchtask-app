import { Router } from "express";
import { HabitController } from "../controllers/habit.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/", HabitController.getAll);
router.post("/", HabitController.create);
router.post("/:id/log", HabitController.logHabit);
router.post("/:id/toggle", HabitController.toggleLog);
router.delete("/:id", HabitController.delete);

export default router;
