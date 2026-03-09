import mongoose from "mongoose";
import wishlistModel from "../../models/wishlistModel.js";
import variantModel from "../../models/admin/variantModel.js";
import cartModel from "../../models/cartModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
// ==============================
// GET WISHLIST
// ==============================
const getWishlist = async (req, res) => {
  const userId = req.session.user.id;
  console.log(userId);
  const userID = new mongoose.Types.ObjectId(userId);
  const products = await wishlistModel
    .find({ userId: userID })
    .populate("variantId")
    .populate("productId");
  res.render("./user/wishlist", {
    products,
  });
};

// ==============================
// ADD TO WISHLIST
// ==============================
const postWishlist = async (req, res) => {
  try {
    const { productId, variant } = req.body;
    const variantId = new mongoose.Types.ObjectId(variant);
    const Variant = await variantModel.findById(variantId);
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    if (!productId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "product not provided",
      });
    }
    if (!Variant) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "variant not provided",
      });
    }
    const existing = await wishlistModel.findOne({
      variantId: Variant._id,
      userId: userId,
      productId: productId,
    });
    const existingCart = await cartModel.findOne({
      variantId: Variant._id,
      userId: userId,
      productId: productId,
    });

    if (existing) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "already exists in wishlist",
      });
    }

    if (existingCart) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "already exist in cart",
      });
    }
    if (!userId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "user not founded",
      });
    }
    let result = await wishlistModel.create({
      userId: userId,
      productId: productId,
      variantId: Variant._id,
    });
    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "added to wishlist",
    });
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// REMOVE ITEM FROM WISHLIST
// ==============================
// Deletes a wishlist item for the logged-in user
// Ensures user can remove only their own wishlist items
const remWishlist = async (req, res) => {
  try {
    const id = req.params.id;
    const wishlistId = new mongoose.Types.ObjectId(id);
    const userId = req.session.user.id;
    if (!wishlistId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "wishlist item not provided",
      });
    }
    await wishlistModel.findOneAndDelete({
      _id: wishlistId,
      userId: req.session.user.id,
    });
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "indernal server error",
    });
  }
};
export default {
  getWishlist,
  postWishlist,
  remWishlist,
};
