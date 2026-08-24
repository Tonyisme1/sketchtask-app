import { Router } from "express";
import { NotebookController } from "../controllers/notebook.controller.js";
const router = Router();
router.get("/", NotebookController.getAll);
router.post("/", NotebookController.create);
router.patch("/:id", NotebookController.update);
export default router;
