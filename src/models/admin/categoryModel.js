import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  },
);
categorySchema.index({ name: "text", description: "text" });

const Category = mongoose.model("Category", categorySchema);
export default Category;
