import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/health
 * Health check endpoint to verify the server is running
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Spotify Clone API is running 🎵",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
