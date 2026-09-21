import mongoose from "mongoose";
let produtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    productStatus: {
      type: String,
      default: true,
    },
    descount: {
      type: Number,
      default: 0,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    catgId: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    variants: [
      {
        type: mongoose.Types.ObjectId,
        ref: "variant",
        required: true,
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);
produtSchema.index({ name: "text", description: "text" });

export default mongoose.model("product", produtSchema);
