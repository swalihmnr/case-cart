import mongoose from "mongoose";
import reviewModel from "../../models/reviewModel.js";
import productModel from "../../models/admin/productModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { updateProductRatingMetrics } from "../../utils/ratingService.js";

// ==============================
// GET ADMIN REVIEWS (PAGE)
// ==============================
const getAdminReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const { search = "", rating = "", product = "" } = req.query;

    const filter = {};
    if (rating && !isNaN(rating)) {
      filter.rating = Number(rating);
    }
    if (product && mongoose.Types.ObjectId.isValid(product)) {
      filter.product = new mongoose.Types.ObjectId(product);
    }
    if (search.trim()) {
      filter.$or = [
        { comment: { $regex: search.trim(), $options: "i" } },
        { title: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [reviews, totalCount, productsList] = await Promise.all([
      reviewModel
        .find(filter)
        .populate("user", "firstName lastName email profileImg")
        .populate("product", "name averageRating totalReviews")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      reviewModel.countDocuments(filter),
      productModel.find({ isBlock: false }).select("name _id").lean(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/review-management", {
      reviews,
      totalReviews: totalCount,
      currentPage: page,
      totalPages,
      search,
      rating,
      selectedProduct: product,
      productsList,
      admin: req.session.admin,
      activePage: "reviews",
    });
  } catch (error) {
    console.error("Error in getAdminReviews:", error);
    req.flash("error", "Failed to load reviews");
    res.redirect("/admin/dashboard");
  }
};

// ==============================
// DELETE ADMIN REVIEW (MODERATION)
// ==============================
const deleteAdminReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid Review ID",
      });
    }

    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Review not found",
      });
    }

    const productId = review.product;
    await reviewModel.findByIdAndDelete(reviewId);

    // Recalculate product rating statistics
    const updatedStats = await updateProductRatingMetrics(productId);

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Review deleted successfully by admin.",
      data: {
        ratingSummary: updatedStats,
      },
    });
  } catch (error) {
    console.error("Error in deleteAdminReview:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

export default {
  getAdminReviews,
  deleteAdminReview,
};
