import mongoose from "mongoose";
import reviewModel from "../models/reviewModel.js";
import productModel from "../models/admin/productModel.js";
import orderModel from "../models/orderModel.js";

/**
 * Recalculates and updates product rating metrics atomically
 * @param {string|mongoose.Types.ObjectId} productId
 * @returns {Promise<Object>} Updated rating summary
 */
export const updateProductRatingMetrics = async (productId) => {
  try {
    const pId = new mongoose.Types.ObjectId(productId);

    const stats = await reviewModel.aggregate([
      { $match: { product: pId } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                avgRating: { $avg: "$rating" },
              },
            },
          ],
          breakdown: [
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const summaryData = stats[0]?.summary[0] || { totalReviews: 0, avgRating: 0 };
    const breakdownData = stats[0]?.breakdown || [];

    const totalReviews = summaryData.totalReviews || 0;
    // Round to 1 decimal place (e.g., 4.6)
    const averageRating = totalReviews > 0 ? Number(summaryData.avgRating.toFixed(1)) : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdownData.forEach((item) => {
      if (item._id >= 1 && item._id <= 5) {
        ratingDistribution[item._id] = item.count;
      }
    });

    await productModel.findByIdAndUpdate(
      pId,
      {
        $set: {
          averageRating,
          totalReviews,
          ratingDistribution,
        },
      },
      { new: true }
    );

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  } catch (error) {
    console.error("Error in updateProductRatingMetrics:", error);
    throw error;
  }
};

/**
 * Validates whether a user has purchased and received the product
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|mongoose.Types.ObjectId} productId
 * @returns {Promise<{ hasPurchased: boolean, order: Object|null }>}
 */
export const checkUserPurchaseEligibility = async (userId, productId) => {
  try {
    if (!userId || !productId) {
      return { hasPurchased: false, order: null };
    }

    const uId = new mongoose.Types.ObjectId(userId);
    const pId = new mongoose.Types.ObjectId(productId);

    // Eligible order: Valid payment and orderItem status is "delivered"
    const order = await orderModel.findOne({
      userId: uId,
      paymentStatus: { $ne: "failed" },
      orderItems: {
        $elemMatch: {
          productId: pId,
          status: "delivered",
        },
      },
    }).select("_id orderId createdAt").lean();

    return {
      hasPurchased: Boolean(order),
      order: order || null,
    };
  } catch (error) {
    console.error("Error in checkUserPurchaseEligibility:", error);
    return { hasPurchased: false, order: null };
  }
};
