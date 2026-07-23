import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import config from "../config";

const router = Router();

/**
 * GET /api/stream/:filename
 * Streams an audio file with HTTP Range request support for seeking.
 */
router.get("/:filename", (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = decodeURIComponent(req.params.filename as string);

    // Prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(config.libraryPath, safeName);

    // Check file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: "File not found" });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(safeName).toLowerCase();

    // Determine MIME type
    const mimeTypes: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".m4a": "audio/mp4",
      ".ogg": "audio/ogg",
      ".wav": "audio/wav",
      ".webm": "audio/webm",
      ".flac": "audio/flac",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    const range = req.headers.range;

    if (range) {
      // Parse range header: "bytes=start-end"
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // No range header — serve the full file
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
