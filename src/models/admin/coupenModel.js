import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    couponCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    discountType: {
      type: String,
      enum: ["fixedamount"],
      required: true
    },

    discountValue: {
      type: Number,
      required: true
    },
    // usedCount: {
    //   type: Number,
    //   required: false,
    //   default:0
    // },

    MinimumPurchaseValue: {
      type: Number,
      default: 0
    },

    // usageLimit: {
    //   type: Number,
    //   default: 1
    // },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["active","inactive", "scheduled", "expired"],
      default: "scheduled"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Coupon", couponSchema);
