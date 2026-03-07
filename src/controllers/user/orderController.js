import mongoose from "mongoose";
import orderModel from "../../models/orderModel.js";
import wallet from "../../models/walletModel.js";
import cartModel from "../../models/cartModel.js";
import calculateBestItemOffer from "../../utils/calculateBestOfferItem.js";
import variantModel from "../../models/admin/variantModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import addressModel from "../../models/addressModel.js";


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
    const skip = (page - 1) * limit
    const search = (req.query.search) || ""
    const selectionFilter = (req.query.filter) || "all"
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
                            as: "user"

                        }
                    },
                    { $unwind: "$user" },

                    {
                        $lookup: {
                            from: "variants",
                            localField: "orderItems.variantId",
                            foreignField: "_id",
                            as: "variant"
                        }
                    },
                    { $unwind: "$variant" },
                    {
                        $lookup: {
                            from: "products",
                            localField: "orderItems.productId",
                            foreignField: "_id",
                            as: "product"
                        }
                    },
                    { $unwind: "$product" },
                    { $skip: skip },
                    { $limit: limit }
                ], count: [
                    { $count: "count" }
                ]
            }
        }
    ]);
    const currentPage = page;
    const orders = result[0].data
    const totalItems = result[0].count[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit)
    console.log(totalItems, totalPages)
    res.render('./admin/order-management', {
        orders,
        selectionFilter,
        currentPage,
        totalPages,
        totalItems,
        search
    })
}

// ==============================
// ORDER CONFIRMATION PAGE
// ==============================
// Shows order details after successful checkout
const getConfirmation = async (req, res) => {
  const userId = req.session.user.id;
  const orderId = req.params.id;
  const order = await orderModel
    .findOne({ _id: orderId })
    .populate("orderItems.productId")
    .populate("orderItems.variantId");
  console.log("CONFIRMATION PAGE - Order Fetched:", {
    id: order._id,
    paymentStatus: order.paymentStatus,
    paymentConfirmedAt: order.paymentConfirmedAt,
    finalAmount: order.finalAmount
  });
  console.log(order);
  res.render("./user/ord-confirmation", {
    order,
  });
};

// ==============================
// PLACE ORDER (FINAL CONFIRMATION)
// ==============================
// Handles order placement for:
// 1. Cart checkout
// 2. Buy Now checkout
// Performs full validation before creating order
const ordConfirmation = async (req, res) => {
  try {
    let walletBalance = await wallet.findOne({ userId: req.session.user.id });
    if (!walletBalance) {
      walletBalance = new wallet({
        balance: 0,
        userId: req.session.user.id
      })
    }
    const FREE_SHIPPING_LIMIT = 1500;

    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const data = req.body.data;

    // ==============================
    // COUPON
    // ==============================
    let coupon = null;
    if (data.couponCode) {
      coupon = await couponModel.findById(
        new mongoose.Types.ObjectId(data.couponCode)
      );
    }

    if (coupon && coupon.usedBy.map(id => id.toString()).includes(userId.toString())) {
      return res.json({
        success: false,
        message: "Coupon already used"
      });
    }



    // ==============================
    // SHIPPING ADDRESS
    // ==============================
    let shippingAddress;

    if (data.address?.addressId) {
      const savedAddress = await addressModel.findById(
        new mongoose.Types.ObjectId(data.address.addressId)
      );

      if (!savedAddress) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }

      shippingAddress = {
        addressType: savedAddress.addressType,
        firstName: savedAddress.firstName,
        lastName: savedAddress.lastName,
        phone: savedAddress.phone,
        streetAddress: savedAddress.streetAddress,
        landMark: savedAddress.landMark,
        city: savedAddress.city,
        state: savedAddress.state,
        pinCode: savedAddress.pinCode,
      };
    } else {
      shippingAddress = data.address;
    }

    // ==============================
    // PAYMENT
    // ==============================
    const paymentMethod = data.paymentMethod;

    if (!["cod", "wallet", "razorpay"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }
    console.log(req.session.variantId)
    // ==============================
    // FETCH ITEMS (BUY NOW / CART)
    // ==============================
    let items = [];

    if (req.session.buyNow) {

      items = await variantModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.session.variantId),
            isListed: true,
            stock: { $gt: 0 }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $addFields: {
            quantity: 1,
            variant: "$$ROOT"
          }
        }
      ]);

    } else {

      items = await cartModel.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "variants",
            localField: "variantId",
            foreignField: "_id",
            as: "variant"
          }
        },
        { $unwind: "$variant" }
      ]);
    }

    if (!items.length) {
      return res.status(404).json({ success: false, message: "No valid items found" });
    }

    // ==============================
    // VALIDATION (AVAILABILITY & STOCK)
    // ==============================
    let unavailableItems = [];
    for (const item of items) {
      if (!item.variant.isListed || item.product.isBlock || item.variant.stock < item.quantity) {
        unavailableItems.push(item.product.name);
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some items in your cart are currently unavailable or out of stock: ${unavailableItems.join(', ')}`
      });
    }

    // ==============================
    // CALCULATIONS (MATCH CHECKOUT)
    // ==============================
    // ==============================
    // CALCULATIONS (FIXED)
    // ==============================
    let subtotal = 0;
    let totalOfferDiscount = 0;
    let totalSavedAmount = 0;
    const orderItems = [];

    let afterProductDiscounts = 0;

    // First calculate original subtotal
    for (const item of items) {
      subtotal += item.variant.orgPrice * item.quantity;
    }
    console.log("Original Subtotal:", subtotal);

    // Then calculate offers for each item
    for (const item of items) {
      const quantity = item.quantity;

      const offerResult = await calculateBestItemOffer({
        quantity,
        variant: item.variant,
        product: item.product
      });

      const totalItemDiscount = offerResult.discountAmount * quantity;
      const totalItemFinal = offerResult.finalPrice * quantity;


      totalOfferDiscount += totalItemDiscount;
      totalSavedAmount += totalItemDiscount;
      afterProductDiscounts += totalItemFinal; // Accumulate final price directly

      console.log(`Item ${item.product.name}:`);
      console.log(`  - Discount: ${totalItemDiscount}`);
      console.log(`  - Final: ${totalItemFinal}`);

      orderItems.push({
        productId: item.product._id,
        variantId: item.variant._id,
        name: item.product.name,
        quantity,
        price: item.variant.salePrice,
        itemTotal: item.variant.salePrice * quantity,
        paymentStatus: paymentMethod === "cod" ? "pending" : paymentMethod === "wallet" ? "paid" : "initiated",
        offer: offerResult.bestOffer ? {
          offerId: offerResult.bestOffer._id,
          title: offerResult.bestOffer.title,
          type: offerResult.bestOffer.offerType,
          value: offerResult.bestOffer.discountValue,
          discountAmount: totalItemDiscount  // ✅ Use totalItemDiscount directly
        } : null,
        finalPrice: totalItemFinal,
        status: "processing"
      });
    }

    // Calculate after product discounts
    // const afterProductDiscounts = subtotal - totalOfferDiscount; // REPLACED with direct accumulation
    console.log("After Product Discounts:", afterProductDiscounts);

    // ==============================
    // SHIPPING
    // ==============================
    const shipping = afterProductDiscounts >= FREE_SHIPPING_LIMIT ? 0 : 50;
    console.log("Shipping:", shipping);

    // Calculate final amount before coupon
    let finalAmount = afterProductDiscounts + shipping;
    console.log("Before Coupon:", finalAmount);

    // ==============================
    // COUPON APPLY
    // ==============================
    let couponDiscount = 0;

    if (coupon) {
      if (afterProductDiscounts < coupon.MinimumPurchaseValue) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of ₹${coupon.MinimumPurchaseValue} is required to apply this coupon.`
        });
      }

      if (coupon.discountType === "percentage") {
        couponDiscount = (afterProductDiscounts * coupon.discountValue) / 100;
        if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
          couponDiscount = Math.min(couponDiscount, coupon.maximumDiscount);
        }
      } else {
        couponDiscount = coupon.discountValue;
      }

      console.log("Coupon Discount:", couponDiscount);

      finalAmount -= couponDiscount;
    }

    // Calculate total savings
    const totalSavings = Math.floor(totalOfferDiscount) + couponDiscount;

    console.log("========== ORDER PRICE DEBUG ==========");
    console.log("Items count:", items.length);
    console.log("Subtotal (Org total):", subtotal);
    console.log("Offer discount total:", totalOfferDiscount);
    console.log("Subtotal after offers:", afterProductDiscounts);
    console.log("Shipping:", shipping);
    console.log("Coupon discount:", couponDiscount);
    console.log("Final amount:", finalAmount);
    console.log("💸 Total Savings:", totalSavings);
    console.log("=======================================");


    // ==============================
    // CREATE ORDER
    // ==============================
    const order = await orderModel.create({
      userId,
      paymentMethod,
      paymentStatus:
        paymentMethod === "cod"
          ? "pending"
          : paymentMethod === "wallet"
            ? "paid"
            : "initiated",

      shippingAddress,
      totalPrice: subtotal,
      totalDiscount: Math.floor(totalOfferDiscount),
      shipping,
      couponId: coupon ? coupon._id : null,
      couponDiscount,
      finalAmount,
      orderItems,
    });
    if (paymentMethod === 'wallet') {
      if (walletBalance?.balance < finalAmount) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Insufficient Amount!"
        })
      }
      walletBalance.balance -= finalAmount;
      walletBalance.transactions.push({
        amount: finalAmount,
        description: "Order Payment",
        orderId: order._id,
        transactionType: "debited"
      })
      order.paymentStatus = "paid";
      order.paymentConfirmedAt = new Date()
      await order.save()
      await walletBalance.save()

    }

    //to add userID for prevent reusing coupons
    if (coupon && paymentMethod !== "razorpay") {
      await couponModel.findByIdAndUpdate(
        coupon._id,
        {
          $addToSet: {
            usedBy: userId
          }
        }
      );
    }

    // ==============================
    // STOCK UPDATE
    // ==============================
    if (paymentMethod !== "razorpay") {
      for (const item of items) {
        await variantModel.updateOne(
          { _id: item.variant._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // ==============================
    // CLEAR CART / BUY NOW SESSION
    // ==============================
    if (!req.session.buyNow && paymentMethod !== "razorpay") {
      await cartModel.deleteMany({ userId });
    }

    if (paymentMethod !== "razorpay") {
      req.session.buyNow = null;
      req.session.variantId = null;
    }

    return res.status(201).json({
      success: true,
      orderId: order._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ==============================
// GET USER ORDERS (ORDER HISTORY)
// ==============================
// Fetches user orders with:
// - Pagination
// - Status filtering
// - Product & variant details
// Fetches user orders with:
// - Pagination
// - Status filtering
// - Product & variant details
const getOrder = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.session.user.id);
  const currentPage = parseInt(req.query.page) || 1;
  const status = req.query.status;
  const limit = 4;
  const skip = (currentPage - 1) * limit;

  let matchQuery = { userId: userId };
  if (status) {
    matchQuery["orderItems.status"] = status;
  }

  const result = await orderModel.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          { $unwind: "$orderItems" },
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
              from: "variants",
              localField: "orderItems.variantId",
              foreignField: "_id",
              as: "variant",
            },
          },
          { $unwind: "$variant" },
          {
            $group: {
              _id: "$_id",
              orderId: { $first: "$orderId" },
              userId: { $first: "$userId" },
              address: { $first: "$address" },
              paymentMethod: { $first: "$paymentMethod" },
              paymentStatus: { $first: "$paymentStatus" },
              totalPrice: { $first: "$totalPrice" },
              couponDiscount: { $first: "$couponDiscount" },
              createdAt: { $first: "$createdAt" },
              orderItems: {
                $push: {
                  _id: "$orderItems._id",
                  orderId: "$orderItems.orderId",
                  productId: "$orderItems.productId",
                  product: "$product",
                  variantId: "$orderItems.variantId",
                  variant: "$variant",
                  quantity: "$orderItems.quantity",
                  finalPrice: "$orderItems.finalPrice",
                  status: "$orderItems.status",
                  cancelledAt: "$orderItems.cancelledAt",
                  cancellationReason: "$orderItems.cancellationReason"
                }
              }
            }
          },
          { $sort: { createdAt: -1 } }
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const orders = result[0].data;
  const totalItems = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  res.render("./user/order-history", {
    orders,
    totalPages,
    currentPage,
    totalItems,
    status,
  });
};

// ==============================
// GET ORDER DETAILS
// ==============================
const getOrderDetails = async (req, res) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.params.id);
    const order = await orderModel.aggregate([
      { $match: { _id: orderId } },
      { $unwind: "$orderItems" },
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
          from: "variants",
          localField: "orderItems.variantId",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },
      {
        $group: {
          _id: "$_id",
          shipping: { $first: "$shipping" },
          orderId: { $first: "$orderId" },
          userId: { $first: "$userId" },
          shippingAddress: { $first: "$shippingAddress" },
          paymentMethod: { $first: "$paymentMethod" },
          paymentStatus: { $first: "$paymentStatus" },
          totalPrice: { $first: "$totalPrice" },
          totalDiscount: { $first: "$totalDiscount" },
          finalAmount: { $first: "$finalAmount" },
          couponDiscount: { $first: "$couponDiscount" },
          createdAt: { $first: "$createdAt" },
          orderItems: {
            $push: {
              _id: "$orderItems._id",
              productId: "$orderItems.productId",
              product: "$product",
              variantId: "$orderItems.variantId",
              variant: "$variant",
              quantity: "$orderItems.quantity",
              finalPrice: "$orderItems.finalPrice",
              status: "$orderItems.status",
              cancelledAt: "$orderItems.cancelledAt",
              cancellationReason: "$orderItems.cancellationReason",
              isReject:"$orderItems.isReject"
            }
          }
        }
      }
    ]);

    if (!order || order.length === 0) {
      return res.status(404).render("error");
    }

    res.render("./user/order-details", { order: order[0] });
  } catch (error) {
    console.error(error);
    res.status(500).render("500");
  }
};
// ==============================
// CHANGE ORDER ITEM STATUS
// ==============================
// Validates order status flow before updating
// Uses flowChecker to prevent invalid status jumps
const orderStatusChanger = async (req, res) => {
    try {
        const { orderItemId, selectedValue } = req.body
        const orderId = new mongoose.Types.ObjectId(req.params.id);
        const orderItemID = new mongoose.Types.ObjectId(orderItemId)
        const crntDbStatus = await orderModel.findOne({ _id: orderId, "orderItems._id": orderItemID }, { 'orderItems.$': 1 })
        const currentDbStatus = crntDbStatus.orderItems[0].status;
        console.log(flowChecker(currentDbStatus, selectedValue))
        if (!flowChecker(currentDbStatus, selectedValue)) {
            console.log('you can not do that ')
            return res.status(STATUS_CODES.FORBIDDEN).json({
                success: false,
                message: `you had to follow the flow that's why you cann't jumb to ${selectedValue}`
            })
        } else {
            if (selectedValue === 'delivered') {
                await orderModel.updateOne({ _id: orderId, "orderItems._id": orderItemID }, {
                    $set: { "orderItems.$.status": selectedValue, "orderItems.$.deliveredAt": new Date(), "orderItems.$.paymentStatus": "paid" }
                })
            } else {
                await orderModel.updateOne({ _id: orderId, "orderItems._id": orderItemID }, {
                    $set: { "orderItems.$.status": selectedValue }
                })
            }

            console.log('status updated')
            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: 'status updated!'
            })
        }


    } catch (error) {
        console.log(error.message)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server Error"
        })
    }
}

// ==============================
// CANCEL WHOLE ORDER
// ==============================
const markPaymentFailed = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === 'initiated') {
      await orderModel.findByIdAndUpdate(orderId, {
        paymentStatus: 'failed',
        'orderItems.$[].paymentStatus': 'failed'
      });
      return res.json({ success: true, message: "Payment marked as failed" });
    }

    return res.json({ success: true, message: "No update needed" });
  } catch (error) {
    console.error("Error marking payment failed:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
}

const cancelWholeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const reason = req.body.reason || "User requested cancellation";

    // Verify order exists and has items that can be cancelled
    const orderExists = await orderModel.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      "orderItems.status": { $in: ['pending', 'placed', 'processing'] }
    });

    if (!orderExists) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled (might be already delivered or cancelled)"
      });
    }


    const cancellableItems = orderExists.orderItems.filter(item =>
      ["pending", "placed", "processing"].includes(item.status)
    );

    if (!cancellableItems.length) {
      return res.status(400).json({
        success: false,
        message: "No items can be cancelled"
      });
    }


    const result = await orderModel.updateMany(
      { _id: new mongoose.Types.ObjectId(orderId) },
      {
        $set: {
          "orderItems.$[elem].status": "cancelled",
          "orderItems.$[elem].cancelledAt": new Date(),
          "orderItems.$[elem].cancellationReason": reason
        }
      },
      {
        arrayFilters: [{ "elem.status": { $in: ["pending", "placed", "processing"] } }]
      }
    );
    if (
      result.modifiedCount > 0 && orderExists.paymentStatus === "paid") {

      let Wallet = await wallet.findOne({
        userId: orderExists.userId
      });

      if (!Wallet) {
        Wallet = await wallet.create({
          userId: orderExists.userId,
          balance: 0,
          transactions: []
        });
      }

      const refund = Math.floor(
        orderExists.finalAmount - orderExists.shipping
      )
      Wallet.balance += refund;

      Wallet.transactions.push({
        amount: refund,
        description: "Refund for cancelled order",
        orderId: orderExists._id,
        transactionType: "credited"
      });

      await Wallet.save();
    }

    // =========================
    // RESTORE STOCK 
    // =========================
    if (orderExists.paymentStatus !== "initiated" && orderExists.paymentStatus !== "failed") {
      for (const item of cancellableItems) {
        await variantModel.updateOne(
          { _id: item.variantId },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    if (result.modifiedCount > 0) {
      return res.json({ success: true, message: "Order cancelled successfully" });
    } else {
      return res.status(400).json({ success: false, message: "No items could be cancelled" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==============================
// CANCEL ORDER ITEM
// ==============================
// Cancels a specific order item (not entire order)
const orderCancel = async (req, res) => {
  try {
    const orderItemId = new mongoose.Types.ObjectId(req.params.id);
    const { orderId, reason } = req.body;
    const orderID = new mongoose.Types.ObjectId(orderId);

    // Check if order exists
    const existingOrder = await orderModel.findOne({
      _id: orderID,
      "orderItems._id": orderItemId
    });

    if (!existingOrder) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Order item not found",
      });
    }

    // Check if item is already cancelled/delivered to prevent invalid state transitions
    const item = existingOrder.orderItems.id(orderItemId);
    if (['cancelled', 'delivered', 'returned'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Item is already ${item.status}`,
      });
    }

    const result = await orderModel.updateOne(
      { _id: orderID, "orderItems._id": orderItemId },
      {
        $set: {
          "orderItems.$.status": "cancelled",
          "orderItems.$.cancelledAt": new Date(),
          "orderItems.$.cancellationReason": reason,
        },
      },
    );

    // ======================
    // RESTORE STOCK
    // ======================
    if (existingOrder.paymentStatus !== "initiated" && existingOrder.paymentStatus !== "failed") {
      await variantModel.updateOne(
        { _id: item.variantId },
        { $inc: { stock: item.quantity } }
      );
    }


    if (result.modifiedCount > 0 && existingOrder.paymentStatus === "paid") {
      let Wallet = await wallet.findOne({ userId: req.session.user.id })
      if (!Wallet) {
        Wallet = await wallet.create({
          userId: req.session.user.id,
          balance: 0,
          transactions: []
        })
      }
      Wallet.balance += item.finalPrice;
      Wallet.transactions.push({
        amount: item.finalPrice,
        description: "Refund for cancelled order",
        orderId: existingOrder._id,
        transactionType: 'credited'
      })


      await Wallet.save()
    }


    if (result.modifiedCount > 0) {
      // Optional: Check if all items are cancelled to update main order status if you track it
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Item cancelled successfully`,
      });
    } else {
      return res.status(400).json({ success: false, message: "Failed to cancel item" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==============================
// GENERATE INVOICE
// ==============================
// Fetches invoice details for a specific order item
const invoice = async (req, res) => {
  const orderItemsId = new mongoose.Types.ObjectId(req.params.id);
  const order_id = req.query.odrId;
  const order = await orderModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(order_id) },
    },
    {
      $unwind: "$orderItems",
    },
    {
      $match: {
        "orderItems._id": orderItemsId,
      },
    },
    {
      $lookup: {
        from: "variants",
        localField: "orderItems.variantId",
        foreignField: "_id",
        as: "variant",
      },
    },
    {
      $unwind: "$variant",
    },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $project: {
        shippingAddress: 1,
        orderId: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        totalPrice: 1,
        finalAmount: 1,
        createdAt: 1,
        orderItem: "$orderItems",
        variant: 1,
        product: 1,
      },
    },
  ]);
  res.render("./user/invoice", {
    order: order[0],
  });
};

// ==============================
// REQUEST RETURN
// ==============================
const returnReq = async (req, res) => {
  try {
    const orderItemId = new mongoose.Types.ObjectId(req.params.id);
    const { orderId, reason } = req.body;
    const existing = await orderModel.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      "orderItems._id": new mongoose.Types.ObjectId(orderItemId),
    });
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "order not founded",
      });
    }
    const item = existing.orderItems.id(orderItemId);
    if (item.status !== "delivered") {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "Return allowed only after delivery",
      });
    }
    item.status = "return_req";
    item.returnReason = reason;
    item.returnedAt = new Date();
    await existing.save();
    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "return requasted.",
    });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error!.",
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
            "orderItems._id": ordItemId
        });

        if (!existing) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Item not found"
            });
        }

        const item = existing.orderItems.id(ordItemId);

        // Prevent duplicate refund
        if (item.status === "returned") {
            return res.json({
                success: false,
                message: "Already returned"
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
            { $inc: { stock: item.quantity } }
        );

        // ======================
        // REFUND (ONLY IF PAID)
        // ======================
        if (existing.paymentStatus === "paid") {

            let Wallet = await wallet.findOne({
                userId: existing.userId
            });

            if (!Wallet) {
                Wallet = await wallet.create({
                    userId: existing.userId,
                    balance: 0,
                    transactions: []
                });
            }

            const refundAmount = item.finalPrice;

            Wallet.balance += refundAmount;

            Wallet.transactions.push({
                amount: refundAmount,
                description: "Refund for returned item",
                orderId: existing._id,
                transactionType: "credited"
            });

            await Wallet.save();
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Return approved & refunded"
        });

    } catch (error) {
        console.error(error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error"
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
        const { itemId } = req.body
        const ordItemId = new mongoose.Types.ObjectId(itemId)
        const existing = await orderModel.findOne({ _id: orderId, 'orderItems._id': ordItemId });
        if (!existing) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Item not Founded"
            })
        }
        const item = existing.orderItems.id(itemId);
        item.status = "delivered"
        item.isReject = true
        await existing.save()
        return res.status(STATUS_CODES.CREATED).json({
            success: true,
            message: "Return Rejected!"
        })
    } catch (error) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server Error!"
        })
    }
}
export default {
    getOrderMngmnt,
    getConfirmation,
    ordConfirmation,
    getOrder,
    getOrderDetails,
    markPaymentFailed,
    cancelWholeOrder,
    orderCancel,
    invoice,
    returnReq,
    orderStatusChanger,
    reqApprove,
    reqReject
}