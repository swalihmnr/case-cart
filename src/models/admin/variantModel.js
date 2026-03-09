import mongoose from "mongoose";
const variantSchema = new mongoose.Schema(
  {
    deviceModel: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    orgPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: false,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "product",
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("variant", variantSchema);
