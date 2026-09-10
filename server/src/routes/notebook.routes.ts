import { Router } from "express";
import { NotebookController } from "../controllers/notebook.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(NotebookController.getAll));
router.post("/", asyncHandler(NotebookController.create));
router.patch("/:id", asyncHandler(NotebookController.update));
router.delete("/:id", asyncHandler(NotebookController.delete));

export default router;
