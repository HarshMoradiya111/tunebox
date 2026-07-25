import { Router } from "express";
import { 
  exportLibrary, 
  getQuickAccess, 
  getLikedCount, 
  getLocalAlbums, 
  getLocalAlbumTracks 
} from "../controllers/libraryController";

const router = Router();

router.get("/export", exportLibrary);
router.get("/quick-access", getQuickAccess);
router.get("/liked-count", getLikedCount);
router.get("/albums", getLocalAlbums);
router.get("/albums/:albumName", getLocalAlbumTracks);

export default router;
