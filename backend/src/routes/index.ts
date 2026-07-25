import { Router } from "express";
import healthRoutes from "./health";
import browseRoutes from "./browse";
import playlistRoutes from "./playlist";
import fetchSongRoutes from "./fetchSong";
import streamRoutes from "./stream";
import musicRoutes from "./musicRoutes";
import uploadRoutes from "./upload";
import trackRoutes from "./tracks";
import smartPlaylistsRoutes from "./smartPlaylists";
import libraryRoutes from "./library";
import storageRoutes from "./storage";
import artistRoutes from "./artists";

const router = Router();

// Mount route groups
router.use("/", healthRoutes);
router.use("/", musicRoutes);
router.use("/browse", browseRoutes);
router.use("/playlist", playlistRoutes);
router.use("/playlists/smart", smartPlaylistsRoutes);
router.use("/library", libraryRoutes);
router.use("/storage", storageRoutes);
router.use("/fetch-song", fetchSongRoutes);
router.use("/stream", streamRoutes);
router.use("/upload", uploadRoutes);
router.use("/tracks", trackRoutes);
router.use("/artists", artistRoutes);

export default router;
