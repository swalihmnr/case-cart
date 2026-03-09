import orderModel from "../../models/orderModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
const getDashboard = async (req, res) => {
  try {
    let dateFilter = {};
    let filter = req.query.filter;

    console.log(filter);

    if (filter === "weekly") {
      let startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      dateFilter = {
        createdAt: {
          $gte: startOfWeek,
        },
      };
    } else if (filter === "monthly") {
      dateFilter = {
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date(),
        },
      };
    } else if (filter === "daily") {
      dateFilter = {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(),
        },
      };
    } else if (filter === "yearly") {
      dateFilter = {
        createdAt: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
        },
      };
    }
    const Order = await orderModel.aggregate([
      {
        $facet: {
          revenueData: [
            { $unwind: "$orderItems" },
            { $match: { "orderItems.status": "delivered" } },
            { $match: { paymentStatus: "paid" } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$finalAmount" },
                totalOrders: { $sum: 1 },
                productSold: { $sum: "$orderItems.quantity" },
              },
            },
            {
              $project: {
                _id: 0,
                productSold: 1,
                totalOrders: 1,
                totalRevenue: 1,
                avarageOrderValue: {
                  $divide: ["$totalRevenue", "$totalOrders"],
                },
              },
            },
          ],
          productData: [
            { $unwind: "$orderItems" },
            { $match: { "orderItems.status": "delivered" } },
            { $match: { paymentStatus: "paid" } },
            {
              $group: {
                _id: "$orderItems.productId",
                totalSold: { $sum: "$orderItems.quantity" },
              },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },
            {
              $project: {
                _id: 0,
                productName: "$product.name",
                totalSold: 1,
              },
            },
          ],
          categoryData: [
            { $match: { paymentStatus: "paid" } },

            { $unwind: "$orderItems" },

            { $match: { "orderItems.status": "delivered" } },

            {
              $group: {
                _id: "$orderItems.productId",
                totalSold: { $sum: "$orderItems.quantity" },
              },
            },

            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },

            {
              $group: {
                _id: "$product.catgId",
                categorySold: { $sum: "$totalSold" },
              },
            },

            { $sort: { categorySold: -1 } },
            { $limit: 10 },

            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "category",
              },
            },
            { $unwind: "$category" },

            {
              $project: {
                _id: 0,
                categoryName: "$category.name",
                categorySold: 1,
              },
            },
          ],
          chartStatusData: [
            { $match: dateFilter },
            { $unwind: "$orderItems" },
            {
              $group: {
                _id: "$orderItems.status",
                count: { $sum: 1 },
              },
            },
          ],
          lineChartData: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                  },
                },
                totalRevenue: { $sum: "$finalAmount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const revenueDatas = Order[0].revenueData;
    const productDatas = Order[0].productData;
    const categoryDatas = Order[0].categoryData;
    const chartStatusData = Order[0].chartStatusData;
    const revenueTrend = Order[0].lineChartData;
    console.log(Order[0].lineChartData);

    res.render("./admin/admin-dashboard", {
      revenueDatas,
      productDatas,
      categoryDatas,
      chartStatusData,
      revenueTrend,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal sever error",
    });
  }
};

export default {
  getDashboard,
};
