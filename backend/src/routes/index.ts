import { Router } from "express";
import healthRoutes from "./health";
import browseRoutes from "./browse";
import playlistRoutes from "./playlist";

const router = Router();

// Mount route groups
router.use("/", healthRoutes);
router.use("/browse", browseRoutes);
router.use("/playlist", playlistRoutes);

// Future routes (added in later phases):
// router.use("/auth", authRoutes);           // Phase 3 OAuth extension
// router.use("/fetch-song", fetchRoutes);    // Phase 4
// router.use("/stream", streamRoutes);       // Phase 5

export default router;
