import { Router } from "express";
import { fetchSong, fetchSongStatus } from "../controllers/fetchController";

const router = Router();

/** POST /api/fetch-song — Trigger async song download */
router.post("/", fetchSong);

/** GET /api/fetch-song/status/:songId — Poll download status */
router.get("/status/:songId", fetchSongStatus);

export default router;
