import { Router } from "express";
import { getMostPlayed, getRecentlyAdded } from "../controllers/smartPlaylistController";

const router = Router();

router.get("/most-played", getMostPlayed);
router.get("/recently-added", getRecentlyAdded);

export default router;
