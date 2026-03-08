import mongoose from "mongoose";
import cartModel from "../../models/cartModel.js";
import variantModel from "../../models/admin/variantModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import productModel from "../../models/admin/productModel.js";
import wishlistModel from "../../models/wishlistModel.js";
import offerModel from "../../models/admin/offerModel.js";
// ==============================
// GET CART PAGE
// ==============================
// Fetches cart items for the logged-in user
// Calculates subtotal and total cart items
const getCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const totalDocs = await cartModel.countDocuments({ userId });

    const cartItems = await cartModel
      .find({ userId })
      .populate("variantId")
      .populate({
        path: "productId",
        populate: { path: "catgId", model: "Category" }
      });

    let subtotal = 0;
    let totalDiscount = 0;
    let finalAmount = 0;
    let shipping = 0;

    for (let item of cartItems) {

      const variant = item.variantId;
      const orgPrice = variant.orgPrice;
      const quantity = item.quantity;

      // sale price discount
      const currentDiscountPerUnit = orgPrice - variant.salePrice;

      // ---------- FIND BEST OFFER ----------
      const offers = await offerModel.find({
        status: "active",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $or: [
          { applicableOn: "product", productIds: { $in: [item.productId._id] } },
          { applicableOn: "category", categoryIds: { $in: [item.productId.catgId._id] } }
        ]
      });

      let bestOffer = null;
      let bestOfferDiscountPerUnit = 0;

      for (let offer of offers) {
        if (offer.offerType === "percentage") {
          // Calculate the discount as the difference between original price and percentage of price
          let discount = orgPrice - ((orgPrice * offer.discountValue) / 100);

          // Apply maximumDiscount cap if explicitly set
          if (offer.maximumDiscount && offer.maximumDiscount > 0) {
            if (discount > offer.maximumDiscount) {
              discount = offer.maximumDiscount;
            }
          }

          if (discount > bestOfferDiscountPerUnit) {
            bestOfferDiscountPerUnit = discount;
            bestOffer = offer;
          }
        }
      }

      // ---------- COMPARE SALE VS OFFER ----------
      let finalUnitPrice;
      let usedDiscountPerUnit;

      if (bestOfferDiscountPerUnit > currentDiscountPerUnit) {

        finalUnitPrice = Math.floor(orgPrice - bestOfferDiscountPerUnit);
        usedDiscountPerUnit = Math.floor(bestOfferDiscountPerUnit);

        item.appliedOffer = {
          title: bestOffer.title,
          discount: usedDiscountPerUnit * quantity,
          discountValue: bestOffer.discountValue
        };

      } else {

        finalUnitPrice = Math.floor(variant.salePrice);
        usedDiscountPerUnit = Math.floor(currentDiscountPerUnit);

        item.appliedOffer = null;
      }

      const itemTotalOrg = orgPrice * quantity;
      const itemFinalTotal = finalUnitPrice * quantity;
      const itemDiscountTotal = usedDiscountPerUnit * quantity;

      subtotal += itemTotalOrg;
      totalDiscount += itemDiscountTotal;
      finalAmount += itemFinalTotal;

      item.finalPrice = itemFinalTotal;
    }

    if (finalAmount > 0 && finalAmount < 1500) {
      shipping = 50;
      finalAmount += shipping;
    }

    res.render("./user/cart", {
      products: cartItems,
      subtotal,
      totalDiscount,
      finalAmount,
      totalDocs,
      shipping,
    });

  } catch (error) {
    console.log(error.message);
  }
};

// ==============================
// ADD ITEM TO CART
// ==============================
// Adds selected variant to cart
// Prevents duplicates
// Removes item from wishlist if exists
const addCart = async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: "Please login to add items to your cart",
        redirectUrl: "/login"
      });
    }

    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const { variantId, productId } = req.body;
    const varinatID = new mongoose.Types.ObjectId(variantId);
    const productID = new mongoose.Types.ObjectId(productId);

    if (!userId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "User not founded",
      });
    }
    if (!varinatID) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "variantId not provided",
      });
    }
    if (!productID) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "productId not provided",
      });
    }
    const variantData = await variantModel.findById(varinatID);
    const productData = await productModel.findById(productID).populate('catgId');

    if (!variantData || !productData) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Product or Variant not found",
      });
    }

    // Validation Check: Stock, Listing, Product Block, Category Active
    if (variantData.stock < 1) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "This product is currently out of stock!",
      });
    }

    if (
      !variantData.isListed ||
      productData.isBlock ||
      (productData.catgId && productData.catgId.isActive === false)
    ) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "This product is currently unavailable!",
      });
    }

    const existing = await cartModel
      .findOne({
        userId: userId._id,
        productId: productID,
        variantId: varinatID,
      })
      .populate("variantId");
    if (existing) {
      console.log("already exist ");
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "already added to cart",
      });
    } else {
      await cartModel.create({
        userId: userId._id,
        productId: productID,
        variantId: varinatID,
      });
      await wishlistModel.deleteOne({
        userId: userId._id,
        productId: productID,
        variantId: varinatID,
      });

      return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: "item added to cart",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Indternal server Error !",
    });
  }
};

// ==============================
// UPDATE CART QUANTITY
// ==============================
// Increases or decreases quantity
// Enforces stock limit, listing status, category status
// Recalculates subtotal dynamically
const cartQuantityUpdate = async (req, res) => {
  try {
    const cartId = req.params.id;
    const userId = req.session.user.id;
    const change = req.body.change;

    const cartItem = await cartModel
      .findById(cartId)
      .populate("variantId")
      .populate({
        path: "productId",
        populate: {
          path: "catgId",
          model: "Category",
        },
      });
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const variant = cartItem.variantId;
    if (change === 1) {
      if (cartItem.quantity >= variant.stock) {
        return res.status(403).json({
          success: false,
          message: " stock limit reached",
        });
      }
      if (cartItem.quantity >= 5) {
        return res.status(403).json({
          success: false,
          message: "Order limit reached",
        });
      }
      if (
        !variant.isListed ||
        cartItem.productId.isBlock ||
        cartItem.productId.catgId.isActive === false
      ) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: "This product currently unavailable!",
        });
      }

      cartItem.quantity += 1;
    } else {
      if (cartItem.quantity > 1) {
        if (
          !variant.isListed ||
          cartItem.productId.isBlock ||
          cartItem.productId.catgId.isActive === false
        ) {
          return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: "This product currently unavailable!",
          });
        }
        cartItem.quantity -= 1;
      }
    }
    await cartItem.save();
    const cartItems = await cartModel
      .find({ userId })
      .populate("variantId")
      .populate("productId");
    let subtotal = 0;
    cartItems.forEach((item) => {
      console.log(item.variantId.salePrice, 'it is the salepirce in here')
      subtotal += Math.round(item.quantity * item.variantId.salePrice)
    });
    return res.status(200).json({
      success: true,
      quantity: cartItem.quantity,
      totalAmountPerPrdct: Math.round(cartItem.quantity * variant.salePrice),
      subtotal,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==============================
// REMOVE ITEM FROM CART
// ==============================
// Deletes a cart item by cartId
// Ensures the item exists before deletion
const remCart = async (req, res) => {
  try {
    const existing = await cartModel.findOne({ _id: req.params.id });
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "user not founded",
      });
    }
    await cartModel.findByIdAndDelete(req.params.id);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "item deleted from cart.",
    });
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal sever Error",
    });
  }
};

export default {
  getCart,
  addCart,
  cartQuantityUpdate,
  remCart
}