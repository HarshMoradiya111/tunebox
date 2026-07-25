import { Router } from "express";
import { getArtists, getArtistTracks } from "../controllers/artistController";

const router = Router();

router.get("/", getArtists);
router.get("/:name/tracks", getArtistTracks);

export default router;
