import { Router } from "express";
import { getUsage } from "../controllers/storageController";

const router = Router();

router.get("/usage", getUsage);

export default router;
