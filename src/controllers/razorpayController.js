import razorpayInstance from "../config/razorpayConfig.js";
import env from 'dotenv';
import crypto from 'crypto';
import orderModel from "../models/orderModel.js";
import { STATUS_CODES } from "../utils/statusCodes.js";

env.config();

export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Order not found"
      });
    }

    const options = {
      amount: Math.round(order.finalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: "receipt_" + orderId,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create payment order"
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment successful

      // Update order status
      await orderModel.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        paymentMethod: 'razorpay',
        transactionId: razorpay_payment_id,
        paymentConfirmedAt: new Date(),
        'orderItems.$[].paymentStatus': 'paid',
        'orderItems.$[].status': 'placed' // Ensure items are marked as placed
      });

      return res.json({
        success: true,
        message: "Payment verified successfully"
      });
    } else {
      // Signature mismatch
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid signature"
      });
    }

  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Payment verification failed"
    });
  }
};
