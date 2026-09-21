import express from "express";
import reviewController from "../../controllers/user/reviewController.js";
import { userAuth, blockUser } from "../../middlewares/auth.js";

const router = express.Router();

// Publicly readable reviews
router.get("/api/products/:productId/reviews", reviewController.getProductReviews);

// Check if current user is eligible to review or already reviewed
router.get("/api/products/:productId/reviews/eligibility", reviewController.checkReviewEligibility);

// Create a new verified review
router.post("/api/products/:productId/reviews", userAuth, blockUser, reviewController.createReview);

// Edit user's own review
router.put("/api/reviews/:reviewId", userAuth, blockUser, reviewController.updateReview);

// Delete user's own review
router.delete("/api/reviews/:reviewId", userAuth, blockUser, reviewController.deleteReview);

export default router;
