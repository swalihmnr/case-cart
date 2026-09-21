import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const reviewSchema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: "product",
      required: [true, "Product reference is required"],
      index: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "user",
      required: [true, "User reference is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
    },
    title: {
      type: String,
      trim: true,
      maxLength: [100, "Review title cannot exceed 100 characters"],
      default: "",
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minLength: [5, "Review must be at least 5 characters long"],
      maxLength: [1000, "Review cannot exceed 1000 characters"],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound unique index: Enforces strictly one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Compound indexes for high-speed paginated sorting
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ product: 1, rating: 1 });

export default mongoose.model("Review", reviewSchema);
