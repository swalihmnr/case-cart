import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    icon: {
      type: String, // Store Cloudinary URL
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

brandSchema.index({ name: "text", description: "text" });

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
