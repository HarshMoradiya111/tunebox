import { Router } from "express";
import multer from "multer";
import os from "os";
import { uploadTrack, deleteUploadedSong } from "../controllers/uploadController";

const router = Router();

// Configure multer to save to temp directory
const upload = multer({ 
  dest: os.tmpdir(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

router.post("/", upload.single("audio"), uploadTrack);
router.delete("/:songId", deleteUploadedSong);

export default router;
