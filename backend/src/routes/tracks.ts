import { Router } from "express";
import {
  toggleLike,
  getLikedTracks,
  recordPlay,
  getRecentlyPlayed,
  searchLocalLibrary
} from "../controllers/trackController";

const router = Router();

router.patch("/:id/like", toggleLike);
router.get("/liked", getLikedTracks);

router.post("/:id/play", recordPlay);
router.get("/recently-played", getRecentlyPlayed);

router.get("/library/search", searchLocalLibrary);

export default router;
