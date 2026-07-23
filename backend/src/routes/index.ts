import { Router } from "express";
import healthRoutes from "./health";
import browseRoutes from "./browse";
import playlistRoutes from "./playlist";
import fetchSongRoutes from "./fetchSong";
import streamRoutes from "./stream";

const router = Router();

// Mount route groups
router.use("/", healthRoutes);
router.use("/browse", browseRoutes);
router.use("/playlist", playlistRoutes);
router.use("/fetch-song", fetchSongRoutes);
router.use("/stream", streamRoutes);

export default router;
