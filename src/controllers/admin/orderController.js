import orderModel from "../../models/orderModel.js";
import mongoose from "mongoose";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import flowChecker from "../../utils/order-flow-checker.js";
import variantModel from "../../models/admin/variantModel.js";
import wallet from "../../models/walletModel.js";

// ==============================
// GET ORDER MANAGEMENT PAGE
// ==============================
// Fetch orders with:
// - Pagination
// - Search by Order ID
// - Filter by order item status
// Uses aggregation to flatten orderItems and join user, product & variant data
const getOrderMngmnt = async (req, res) => {
  const limit = 8;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const selectionFilter = req.query.filter || "all";
  const filter = {};
  if (search) {
    filter.orderId = { $regex: search, $options: "i" };
  }

  if (selectionFilter !== "all") {
    filter["orderItems.status"] = selectionFilter;
  }

  const result = await orderModel.aggregate([
    { $unwind: "$orderItems" },
    { $match: filter },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },

          {
            $lookup: {
              from: "variants",
              localField: "orderItems.variantId",
              foreignField: "_id",
              as: "variant",
            },
          },
          { $unwind: "$variant" },
          {
            $lookup: {
              from: "products",
              localField: "orderItems.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          { $skip: skip },
          { $limit: limit },
        ],
        count: [{ $count: "count" }],
      },
    },
  ]);
  const currentPage = page;
  const orders = result[0].data;
  const totalItems = result[0].count[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);
  console.log(totalItems, totalPages);
  res.render("./admin/order-management", {
    orders,
    selectionFilter,
    currentPage,
    totalPages,
    totalItems,
    search,
  });
};

// ==============================
// GET ORDER DETAILS (SINGLE PAGE)
// ==============================
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemId = req.params.itemId;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      req.flash("error", "Invalid order.");
      return res.redirect("/admin/order");
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      req.flash("error", "Invalid order item.");
      return res.redirect("/admin/order");
    }

    const result = await orderModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
      { $unwind: "$orderItems" },
      { $match: { "orderItems._id": new mongoose.Types.ObjectId(itemId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "variants",
          localField: "orderItems.variantId",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "coupon",
        },
      },
      {
        $unwind: { path: "$coupon", preserveNullAndEmptyArrays: true },
      },
    ]);

    if (!result || result.length === 0) {
      req.flash("error", "No records found.");
      return res.redirect("/admin/order");
    }
    const order = result[0];

    res.render("./admin/order-details", {
      order,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send("Internal Server Error");
  }
};

// ==============================
// CHANGE ORDER ITEM STATUS
// ==============================
// Validates order status flow before updating
// Uses flowChecker to prevent invalid status jumps
const orderStatusChanger = async (req, res) => {
  try {
    const { orderItemId, selectedValue } = req.body;
    const orderId = new mongoose.Types.ObjectId(req.params.id);
    const orderItemID = new mongoose.Types.ObjectId(orderItemId);
    const crntDbStatus = await orderModel.findOne(
      { _id: orderId, "orderItems._id": orderItemID },
      { "orderItems.$": 1 },
    );
    const currentDbStatus = crntDbStatus.orderItems[0].status;
    console.log(flowChecker(currentDbStatus, selectedValue));
    if (!flowChecker(currentDbStatus, selectedValue)) {
      console.log("you can not do that ");
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: `you had to follow the flow that's why you cann't jumb to ${selectedValue}`,
      });
    } else {
      if (selectedValue === "delivered") {
        await orderModel.updateOne(
          { _id: orderId, "orderItems._id": orderItemID },
          {
            $set: {
              "orderItems.$.status": selectedValue,
              "orderItems.$.deliveredAt": new Date(),
              "orderItems.$.paymentStatus": "paid",
            },
          },
        );

        // Check if all items in the order are paid or cancelled
        const orderAfterUpdate = await orderModel.findById(orderId);
        const allPaidOrCancelled = orderAfterUpdate.orderItems.every(
          (item) =>
            item.paymentStatus === "paid" || item.status === "cancelled",
        );

        if (allPaidOrCancelled && orderAfterUpdate.paymentStatus !== "paid") {
          await orderModel.updateOne(
            { _id: orderId },
            {
              $set: { paymentStatus: "paid", paymentConfirmedAt: new Date() },
            },
          );
        }
      } else {
        await orderModel.updateOne(
          { _id: orderId, "orderItems._id": orderItemID },
          {
            $set: { "orderItems.$.status": selectedValue },
          },
        );
      }

      console.log("status updated");
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: "status updated!",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error",
    });
  }
};

// ==============================
// APPROVE RETURN REQUEST
// ==============================
// Admin approves product return
// Order item status changed to "returned"
const reqApprove = async (req, res) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.params.id);
    const { itemId } = req.body;
    const ordItemId = new mongoose.Types.ObjectId(itemId);

    const existing = await orderModel.findOne({
      _id: orderId,
      "orderItems._id": ordItemId,
    });

    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Item not found",
      });
    }

    const item = existing.orderItems.id(ordItemId);

    // Prevent duplicate refund
    if (item.status === "returned") {
      return res.json({
        success: false,
        message: "Already returned",
      });
    }

    // ======================
    // UPDATE STATUS
    // ======================
    item.status = "returned";
    item.returnedAt = new Date();

    await existing.save();

    // ======================
    // RESTORE STOCK
    // ======================
    await variantModel.updateOne(
      { _id: item.variantId },
      { $inc: { stock: item.quantity } },
    );

    // ======================
    // REFUND (ONLY IF PAID)
    // ======================
    // Check both order-level and item-level payment status (important for COD)
    if (existing.paymentStatus === "paid" || item.paymentStatus === "paid") {
      let Wallet = await wallet.findOne({
        userId: existing.userId,
      });

      if (!Wallet) {
        Wallet = await wallet.create({
          userId: existing.userId,
          balance: 0,
          transactions: [],
        });
      }

      const refundAmount = item.finalPrice;

      Wallet.balance += refundAmount;

      Wallet.transactions.push({
        amount: refundAmount,
        description: "Refund for returned item",
        orderId: existing._id,
        transactionType: "credited",
      });

      await Wallet.save();
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Return approved & refunded",
    });
  } catch (error) {
    console.error(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// REJECT RETURN REQUEST
// ==============================
// Admin rejects return request
// Status reverted to delivered and marked as rejected
const reqReject = async (req, res) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.params.id);
    const { itemId } = req.body;
    const ordItemId = new mongoose.Types.ObjectId(itemId);
    const existing = await orderModel.findOne({
      _id: orderId,
      "orderItems._id": ordItemId,
    });
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Item not Founded",
      });
    }
    const item = existing.orderItems.id(itemId);
    item.status = "delivered";
    item.isReject = true;
    await existing.save();
    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "Return Rejected!",
    });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error!",
    });
  }
};

export default {
  getOrderMngmnt,
  getOrderDetails,
  orderStatusChanger,
  reqApprove,
  reqReject,
};
