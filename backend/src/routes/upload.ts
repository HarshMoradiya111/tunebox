import { Router } from "express";
import multer from "multer";
import os from "os";
import { uploadTrack, deleteUploadedSong, editUploadedSong, getUploadedSongs } from "../controllers/uploadController";

const router = Router();

// Configure multer to save to temp directory
const upload = multer({ 
  dest: os.tmpdir(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

router.post("/", upload.fields([{ name: "audio", maxCount: 1 }, { name: "coverArt", maxCount: 1 }]), uploadTrack);
router.delete("/:songId", deleteUploadedSong);
router.patch("/:songId", editUploadedSong);
router.get("/", getUploadedSongs);

export default router;
