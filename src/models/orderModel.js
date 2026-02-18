import mongoose from "mongoose";

const { Schema, Types } = mongoose;

/**
 * Generates a custom Order ID: ORD-YYYY-RANDOM
 */
function generateOrderId() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${random}`;
}

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      default: generateOrderId,
      unique: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["wallet", "cod", "razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "initiated", "paid", "failed"],
      required: true,
      default: "pending",
    },
    transactionId: {
      type: String,
    },
    paymentConfirmedAt: {
      type: Date,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      default: 0
    },
    couponId: {
      type: Types.ObjectId,
      ref: "coupon",
      default: null,
    },
    couponDiscount: {
      type: Number,
      required: false,
      default: 0
    },
    shippingAddress: {
      addressType: {
        type: String,
        required: true,
      },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      streetAddress: { type: String, required: true },
      landMark: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
    },
    orderItems: [
      {
        productId: {
          type: Types.ObjectId,
          ref: "product",
          required: true,
        },
        variantId: {
          type: Types.ObjectId,
          ref: "variant",
          required: true,
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "initiated", "paid", "failed"],
          default: "pending",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        finalPrice: {
          type: Number,
          required: true,
        },
        itemTotal: {
          type: Number,
          required: true,
        },
        // EXPLICIT OBJECT DEFINITION TO PREVENT CAST ERRORS
        offer: {
          offerId: {
            type: Types.ObjectId,
            ref: "offer",
            default: null,
          },
          title: { type: String, default: null },
          type: { type: String, default: null },
          value: { type: Number, default: 0 },
          appliedOn: { type: String, default: null },
          discountAmount: { type: Number, default: 0 },
        },
        status: {
          type: String,
          enum: [
            "placed",
            "confirmed",
            "processing",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "returned",
            "return_req",
          ],
          default: "placed",
        },
        invoiceGenerated: {
          type: Boolean,
          default: false,
        },
        isReject: {
          type: Boolean,
          default: false,
        },
        shippedAt: Date,
        deliveredAt: Date,
        cancelledAt: Date,
        cancellationReason: String,
        returnedAt: Date,
        returnReason: String,
        paymentConfirmedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook example (optional) to ensure pinCode is stored correctly
orderSchema.pre('save', function (next) {
  // If you need any specific logic before saving the order
  next();
});

export default mongoose.model("Order", orderSchema);