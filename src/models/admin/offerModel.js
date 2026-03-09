import mongoose from "mongoose";
const { Schema } = mongoose;
const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    offerType: {
      type: String,
      enum: ["percentage"],
      required: true,
    },

    applicableOn: {
      type: String,
      enum: ["category", "product"],
      required: true,
    },

    categoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "product",
      },
    ],

    discountValue: {
      type: Number,
      required: true,
    },
    maximumDiscount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "scheduled", "inactive"],
      default: "scheduled",
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
export default mongoose.model("offer", offerSchema);
