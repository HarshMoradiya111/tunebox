import { Router } from "express";
import { exportLibrary } from "../controllers/libraryController";

const router = Router();

router.get("/export", exportLibrary);

export default router;
