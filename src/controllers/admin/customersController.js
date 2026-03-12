import user from "../../models/userModel.js";
import mongoose from "mongoose";
import Order from "../../models/orderModel.js";
// Fetch customers with:
// - Pagination
// - Search
// - Active / Blocked filter
// - Monthly joined users count
const getCustomer = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const selectionFilter = req.query.filter || "all";
    const limit = 4;
    const skip = (page - 1) * limit;

    // Build match stage based on filters
    let matchStage = { isVerified: true };

    // Search conditions
    if (search !== "") {
      matchStage.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { number: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (selectionFilter === "active") {
      matchStage.isBlock = false;
    } else if (selectionFilter === "blocked") {
      matchStage.isBlock = true;
    }
    // For "all", no isBlock filter needed

    // Get date range for this month's joiners
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Aggregation pipeline for customers with order stats
    const aggregationPipeline = [
      // Match stage for filtering
      { $match: matchStage },

      // Lookup orders for each user
      {
        $lookup: {
          from: "orders",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                paymentStatus: { $ne: "failed" }, // Exclude failed payments
              },
            },
            {
              $group: {
                _id: null,
                orderCount: { $sum: 1 },
                totalSpent: { $sum: "$finalAmount" },
              },
            },
          ],
          as: "orderStats",
        },
      },

      // Add order stats to user document
      {
        $addFields: {
          orderCount: {
            $ifNull: [{ $arrayElemAt: ["$orderStats.orderCount", 0] }, 0],
          },
          totalSpent: {
            $ifNull: [{ $arrayElemAt: ["$orderStats.totalSpent", 0] }, 0],
          },
          // Check if user joined this month
          isThisMonthJoiner: {
            $and: [
              { $gte: ["$createdAt", startOfMonth] },
              { $lte: ["$createdAt", endOfMonth] },
            ],
          },
        },
      },

      // Remove the temporary orderStats array
      { $project: { orderStats: 0 } },

      // Sort by creation date (newest first)
      { $sort: { createdAt: -1 } },

      // Pagination
      { $skip: skip },
      { $limit: limit },
    ];

    // Execute aggregation for paginated customers
    const customers = await user.aggregate(aggregationPipeline);

    // Get total count for pagination (using the same match stage)
    const totalItems = await user.countDocuments(matchStage);

    // Get counts for different user categories
    const [totalBlockCount, totalActiveCount, totalCustomers, thisMonthCount] =
      await Promise.all([
        user.countDocuments({ isBlock: true, isVerified: true }),
        user.countDocuments({ isBlock: false, isVerified: true }),
        user.countDocuments({ isVerified: true }),
        user.countDocuments({
          isVerified: true,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),
      ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);

    // Get overall order statistics for all customers (optional)
    const overallOrderStats = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $ne: "failed" },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          averageOrderValue: { $avg: "$finalAmount" },
        },
      },
    ]);

    // Format response data
    res.status(200).render("./admin/admin-customer", {
      customers,
      currentPage: page,
      totalItems,
      totalPages,
      skip,
      limit,
      search,
      selectionFilter,
      // Counts
      totalBlockCount,
      totalActiveCount,
      thisMonth: thisMonthCount,
      totalCustomers,
      // Overall stats (optional)
      overallStats: overallOrderStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      },
    });
  } catch (error) {
    console.error("Error in getCustomer:", error);
    res.status(500).render("./admin/error", {
      message: "Failed to load customers",
      error: error.message,
    });
  }
};

// Block or unblock a customer
// Toggle isBlock status
const blockCustomer = async (req, res) => {
  try {
    let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
          req.flash("error", "Invalid customer.");
          return res.redirect("/admin/customers");
        }
    const objectId = new mongoose.Types.ObjectId(id);
    const exsitng = await user.findOne({ _id: objectId });
    if (exsitng) {
      if (exsitng.isBlock) {
        exsitng.isBlock = false;
        await exsitng.save();
        return res.status(200).json({
          success: "unblocked ",
          status: false,
        });
      } else {
        exsitng.isBlock = true;
        await exsitng.save();
        return res.status(200).json({
          success: "Blocked ",
          status: true,
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "Not Founded",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export default {
  getCustomer,
  blockCustomer,
};
