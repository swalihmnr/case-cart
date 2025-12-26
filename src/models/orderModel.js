    import mongoose from "mongoose";
const { Schema, Types } = mongoose;
function generateOrderId() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${random}`;
}
const orderSchema = new Schema({
 orderId:{
  type:String,
  default:generateOrderId(),
  unique:true
 },
  userId: {
    type: Types.ObjectId,
    ref: "user",
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ["wallet", "cod", "razorpay"],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "initiated", "paid", "failed"],
    required: true
  },

  transactionId: {
    type: String
  },

  totalPrice: {
    type: Number,
    required: true
  },

  discount: {
    type: Number,
    default: 0
  },

  finalAmount: {
    type: Number,
    required: true
  },

  couponId: {
    type: Types.ObjectId,
    ref: "coupon",
    default: null
  },

  shippingAddress: {
    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      required: true
    },
    firstName: String,
    lastName: String,
    phone: String,
    streetAddress: String,
    landMark: String,
    city: String,
    state: String,
    pincode: String
  },

  orderItems: [
    {
      productId: {
        type: Types.ObjectId,
        ref: "product",
        required: true
      },
      variantId: {
        type: Types.ObjectId,
        ref: "variant",
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },

      status: {
        type: String,
        enum: ["processing", "shipped", "delivered", "cancelled", "returned"],
        default: "processing"
      },
      invoiceNumber:String,
      invoiceCreatedAt:Date,
      invoiceGenerated:{
        type:Boolean,
        default:false

      },
      shippedAt: Date,
      deliveredAt: Date,
      cancelledAt: Date,
      cancellationReason: String,
      returnedAt: Date,
      returnReason: String,
      paymentConfirmedAt: Date
    }
  ]

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
