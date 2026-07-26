import { Router } from "express";
import { 
  exportLibrary, 
  getQuickAccess, 
  getLikedCount, 
  getLocalAlbums, 
  getLocalAlbumTracks,
  getMissingTracksQueue,
  removeMissingTrack
} from "../controllers/libraryController";

const router = Router();

router.get("/export", exportLibrary);
router.get("/quick-access", getQuickAccess);
router.get("/liked-count", getLikedCount);
router.get("/albums", getLocalAlbums);
router.get("/albums/:albumName", getLocalAlbumTracks);
router.get("/missing", getMissingTracksQueue);
router.delete("/missing/:playlistId/:spotifyId", removeMissingTrack);

export default router;
