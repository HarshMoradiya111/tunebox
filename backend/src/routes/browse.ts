import { Router } from "express";
import {
  featuredPlaylists,
  newReleases,
  browseCategories,
} from "../controllers";

const router = Router();

/** GET /api/browse/featured — Featured playlists */
router.get("/featured", featuredPlaylists);

/** GET /api/browse/new-releases — New album releases */
router.get("/new-releases", newReleases);

/** GET /api/browse/categories — Genre categories for search */
router.get("/categories", browseCategories);

export default router;
