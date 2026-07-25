import { Router } from "express";
import {
  toggleLike,
  getLikedTracks,
  recordPlay,
  getRecentlyPlayed,
  searchLocalLibrary,
  updateTags,
  batchDelete,
  batchTags
} from "../controllers/trackController";

const router = Router();

router.patch("/:id/like", toggleLike);
router.get("/liked", getLikedTracks);

router.post("/:id/play", recordPlay);
router.get("/recently-played", getRecentlyPlayed);

router.get("/library/search", searchLocalLibrary);

router.patch("/:id/tags", updateTags);
router.post("/batch-delete", batchDelete);
router.post("/batch-tags", batchTags);

export default router;
