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
    await wishlistModel.create({
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
// TOGGLE WISHLIST
// ==============================
const toggleWishlist = async (req, res) => {
  try {
    const { productId, variant } = req.body;
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const variantId = new mongoose.Types.ObjectId(variant);

    const existing = await wishlistModel.findOne({
      userId,
      productId,
      variantId,
    });

    if (existing) {
      await wishlistModel.findByIdAndDelete(existing._id);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        action: "removed",
        message: "Removed from wishlist",
      });
    } else {
      const existingCart = await cartModel.findOne({
        variantId,
        userId,
        productId,
      });

      if (existingCart) {
        return res.status(STATUS_CODES.CONFLICT).json({
          success: false,
          message: "Already exists in cart",
        });
      }

      await wishlistModel.create({
        userId,
        productId,
        variantId,
      });

      return res.status(STATUS_CODES.CREATED).json({
        success: true,
        action: "added",
        message: "Added to wishlist",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// REMOVE ITEM FROM WISHLIST
// ==============================
const remWishlist = async (req, res) => {
  try {
    const id = req.params.id;
    const wishlistId = new mongoose.Types.ObjectId(id);
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
      message: "Internal server error",
    });
  }
};

export default {
  getWishlist,
  postWishlist,
  remWishlist,
  toggleWishlist,
};
