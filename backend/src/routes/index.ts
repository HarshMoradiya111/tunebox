import { Router } from "express";
import healthRoutes from "./health";

const router = Router();

// Mount route groups
router.use("/", healthRoutes);

// Future routes (added in later phases):
// router.use("/browse", browseRoutes);      // Phase 3
// router.use("/playlist", playlistRoutes);   // Phase 3
// router.use("/auth", authRoutes);           // Phase 3
// router.use("/fetch-song", fetchRoutes);    // Phase 4
// router.use("/stream", streamRoutes);       // Phase 5

export default router;
