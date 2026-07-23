import { Router } from "express";
import { getPlaylistById } from "../controllers";

const router = Router();

/** GET /api/playlist/:spotifyId — Full playlist with tracks */
router.get("/:spotifyId", getPlaylistById);

export default router;
