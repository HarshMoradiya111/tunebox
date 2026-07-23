import { Router } from "express";
import healthRoutes from "./health";
import browseRoutes from "./browse";
import playlistRoutes from "./playlist";
import fetchSongRoutes from "./fetchSong";

const router = Router();

// Mount route groups
router.use("/", healthRoutes);
router.use("/browse", browseRoutes);
router.use("/playlist", playlistRoutes);
router.use("/fetch-song", fetchSongRoutes);

// Future routes (added in later phases):
// router.use("/auth", authRoutes);           // Phase 3 OAuth extension
// router.use("/stream", streamRoutes);       // Phase 5

export default router;
