import express from "express";
import adminReviewController from "../../controllers/admin/adminReviewController.js";
import { requiredAdmin } from "../../middlewares/auth.js";

const router = express.Router();

// Admin Reviews listing page
router.get("/reviews", requiredAdmin, adminReviewController.getAdminReviews);

// Admin Review deletion endpoint
router.delete("/reviews/:reviewId", requiredAdmin, adminReviewController.deleteAdminReview);

export default router;
