import express from "express";
const router = express.Router();

import homepageSettingsController from "../../controllers/admin/homepageSettingsController.js";
import { requiredAdmin } from "../../middlewares/auth.js";
import upload from "../../middlewares/multer.js";

router.use(requiredAdmin);

router.get("/homepage-settings", homepageSettingsController.getHomepageSettings);
router.post("/homepage-settings", upload.single("bannerImage"), homepageSettingsController.saveHomepageSettings);
router.post("/homepage-settings/banner/delete-image", homepageSettingsController.deleteBannerImage);
router.post("/homepage-settings/ticker/add", homepageSettingsController.addTickerItem);
router.post("/homepage-settings/ticker/delete/:itemId", homepageSettingsController.deleteTickerItem);
router.post("/homepage-settings/ticker/toggle/:itemId", homepageSettingsController.toggleTickerItem);

export default router;
