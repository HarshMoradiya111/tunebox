import { Router } from "express";
import healthRoutes from "./health";
import browseRoutes from "./browse";
import playlistRoutes from "./playlist";
import fetchSongRoutes from "./fetchSong";
import streamRoutes from "./stream";
import musicRoutes from "./musicRoutes";
import uploadRoutes from "./upload";

const router = Router();

// Mount route groups
router.use("/", healthRoutes);
router.use("/", musicRoutes);
router.use("/browse", browseRoutes);
router.use("/playlist", playlistRoutes);
router.use("/fetch-song", fetchSongRoutes);
router.use("/stream", streamRoutes);
router.use("/upload", uploadRoutes);

export default router;
