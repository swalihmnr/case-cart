import mongoose from "mongoose";
import reviewModel from "../../models/reviewModel.js";
import productModel from "../../models/admin/productModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import {
  updateProductRatingMetrics,
  checkUserPurchaseEligibility,
} from "../../utils/ratingService.js";

/**
 * Basic HTML sanitizer to strip dangerous script tags and HTML elements
 */
const sanitizeInput = (text) => {
  if (typeof text !== "string") return "";
  return text.replace(/<[^>]*>?/gm, "").trim();
};

// ==============================
// GET PRODUCT REVIEWS (PAGINATED)
// ==============================
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;
    const sortType = req.query.sort || "newest";

    let sortStage = { createdAt: -1 };
    if (sortType === "highest") sortStage = { rating: -1, createdAt: -1 };
    if (sortType === "lowest") sortStage = { rating: 1, createdAt: -1 };
    if (sortType === "oldest") sortStage = { createdAt: 1 };

    const pId = new mongoose.Types.ObjectId(productId);

    const [reviews, totalCount, product] = await Promise.all([
      reviewModel
        .find({ product: pId })
        .populate("user", "firstName lastName profileImg")
        .sort(sortStage)
        .skip(skip)
        .limit(limit)
        .lean(),
      reviewModel.countDocuments({ product: pId }),
      productModel.findById(pId).select("averageRating totalReviews ratingDistribution name").lean(),
    ]);

    if (!product) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    const currentUserId = req.session.user?.id || req.session.user?._id;
    let userReview = null;
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      userReview = await reviewModel
        .findOne({ product: pId, user: new mongoose.Types.ObjectId(currentUserId) })
        .lean();
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        reviews,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        ratingSummary: {
          averageRating: product.averageRating || 0,
          totalReviews: product.totalReviews || 0,
          ratingDistribution: product.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        userReview,
      },
    });
  } catch (error) {
    console.error("Error in getProductReviews:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

// ==============================
// CHECK REVIEW ELIGIBILITY
// ==============================
const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    const userId = req.session.user?.id || req.session.user?._id;
    if (!userId) {
      return res.status(STATUS_CODES.OK).json({
        success: true,
        canReview: false,
        hasPurchased: false,
        isLoggedIn: false,
        message: "Please sign in to write a review.",
      });
    }

    const [purchaseCheck, existingReview] = await Promise.all([
      checkUserPurchaseEligibility(userId, productId),
      reviewModel.findOne({
        product: new mongoose.Types.ObjectId(productId),
        user: new mongoose.Types.ObjectId(userId),
      }).lean(),
    ]);

    const hasPurchased = purchaseCheck.hasPurchased;
    const alreadyReviewed = Boolean(existingReview);
    const canReview = hasPurchased && !alreadyReviewed;

    return res.status(STATUS_CODES.OK).json({
      success: true,
      isLoggedIn: true,
      hasPurchased,
      alreadyReviewed,
      canReview,
      userReview: existingReview || null,
    });
  } catch (error) {
    console.error("Error in checkReviewEligibility:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to verify review eligibility",
    });
  }
};

// ==============================
// CREATE REVIEW (VERIFIED ONLY)
// ==============================
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    const userId = req.session.user?.id || req.session.user?._id;
    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "You must be logged in to leave a review",
      });
    }

    let { rating, title, comment } = req.body;
    rating = Number(rating);

    // Validation
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Please provide a valid rating between 1 and 5 stars",
      });
    }

    comment = sanitizeInput(comment);
    if (!comment || comment.length < 5) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Review comment must be at least 5 characters long",
      });
    }
    if (comment.length > 1000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Review comment cannot exceed 1000 characters",
      });
    }

    title = sanitizeInput(title || "");
    if (title.length > 100) {
      title = title.substring(0, 100);
    }

    // Verified Purchase Check
    const { hasPurchased } = await checkUserPurchaseEligibility(userId, productId);
    if (!hasPurchased) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "Only customers who have purchased and received this product can write a review.",
      });
    }

    // Duplicate Check
    const existing = await reviewModel.findOne({
      product: new mongoose.Types.ObjectId(productId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (existing) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "You have already reviewed this product. You can edit your existing review instead.",
        reviewId: existing._id,
      });
    }

    // Create Review
    const newReview = await reviewModel.create({
      product: new mongoose.Types.ObjectId(productId),
      user: new mongoose.Types.ObjectId(userId),
      rating,
      title,
      comment,
      isVerifiedPurchase: true,
    });

    // Update Product Statistics Atomically
    const updatedStats = await updateProductRatingMetrics(productId);

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "Thank you! Your verified review has been published.",
      data: {
        review: newReview,
        ratingSummary: updatedStats,
      },
    });
  } catch (error) {
    // Handle MongoDB duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "You have already submitted a review for this product.",
      });
    }
    console.error("Error in createReview:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to submit your review. Please try again.",
    });
  }
};

// ==============================
// UPDATE REVIEW (OWNERSHIP CHECK)
// ==============================
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid Review ID",
      });
    }

    const userId = req.session.user?.id || req.session.user?._id;
    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Review not found",
      });
    }

    // Ownership Authorization Check
    if (review.user.toString() !== userId.toString()) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to edit this review",
      });
    }

    let { rating, title, comment } = req.body;
    rating = Number(rating);

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Please provide a valid rating between 1 and 5 stars",
      });
    }

    comment = sanitizeInput(comment);
    if (!comment || comment.length < 5) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Review comment must be at least 5 characters long",
      });
    }
    if (comment.length > 1000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Review comment cannot exceed 1000 characters",
      });
    }

    title = sanitizeInput(title || "");
    if (title.length > 100) title = title.substring(0, 100);

    review.rating = rating;
    review.title = title;
    review.comment = comment;
    await review.save();

    // Recalculate rating metrics
    const updatedStats = await updateProductRatingMetrics(review.product);

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Your review has been updated successfully.",
      data: {
        review,
        ratingSummary: updatedStats,
      },
    });
  } catch (error) {
    console.error("Error in updateReview:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

// ==============================
// DELETE REVIEW (OWNERSHIP CHECK)
// ==============================
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid Review ID",
      });
    }

    const userId = req.session.user?.id || req.session.user?._id;
    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Review not found",
      });
    }

    // Ownership Authorization Check
    if (review.user.toString() !== userId.toString()) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }

    const productId = review.product;
    await reviewModel.findByIdAndDelete(reviewId);

    // Recalculate rating metrics
    const updatedStats = await updateProductRatingMetrics(productId);

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Your review has been deleted.",
      data: {
        ratingSummary: updatedStats,
      },
    });
  } catch (error) {
    console.error("Error in deleteReview:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

export default {
  getProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
};
