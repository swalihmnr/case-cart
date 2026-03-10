import wallet from "../../models/walletModel.js";
import mongoose from "mongoose";
import couponModel from "../../models/admin/coupenModel.js";
import cartModel from "../../models/cartModel.js";
import calculateBestItemOffer from "../../utils/calculateBestOfferItem.js";
import addressModel from "../../models/addressModel.js";
import variantModel from "../../models/admin/variantModel.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
// ==============================
// GET CHECKOUT PAGE
// ==============================
// Handles both Cart checkout and Buy Now checkout
// Validates product availability before proceeding
const getCheckout = async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.redirect("/login");
    }
    let cartItems = [];
    let subtotal = 0; // ORIGINAL TOTAL
    let offerDiscountTotal = 0;
    let finalAmount = 0;
    let shipping = 0;
    let coupons;
    const walletBalance = await wallet.findOne({ userId: req.session.user.id });
    const FREE_SHIPPING_LIMIT = 1500;
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    const { type, variantId } = req.query;
    
    // Validate variantId if provided
    if (variantId && !mongoose.Types.ObjectId.isValid(variantId)) {
      req.flash(
        "error",
        "The selected product option is invalid. Please try again.",
      );
      return res.redirect("/product");
    }

    coupons = await couponModel.find({
      status: "active",
      usedBy: { $ne: userId },
    });
    // ======================
    // CART FLOW
    // ======================
    if (type !== "buyNow") {
      req.session.buyNow = false;
      // Cart flow - Get items from user's cart
      cartItems = await cartModel.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "variants",
            localField: "variantId",
            foreignField: "_id",
            as: "variant",
          },
        },
        { $unwind: "$variant" },
        {
          $addFields: {
            mainImage: {
              $first: {
                $filter: {
                  input: "$product.productImages",
                  as: "img",
                  cond: { $eq: ["$$img.isMain", true] },
                },
              },
            },
          },
        },
        {
          $project: {
            product: 1,
            variant: 1,
            quantity: 1,
            mainImage: 1,
            orgPrice: "$variant.orgPrice",
          },
        },
      ]);

      if (!cartItems.length) return res.redirect("/cart");

      // Calculate offers for each cart item
      for (let item of cartItems) {
        // Validation Check: Stock, Listing, Product Block
        if (
          !item.variant.isListed ||
          item.product.isBlock ||
          item.variant.stock < item.quantity
        ) {
          return res.redirect(
            "/cart?error=Some items in your cart are currently unavailable or out of stock.",
          );
        }

        const orgTotal = item.variant.orgPrice * item.quantity;
        subtotal += orgTotal;

        const offerResult = await calculateBestItemOffer(item);

        const totalItemDiscount = offerResult.discountAmount * item.quantity;
        const totalItemFinal = offerResult.finalPrice * item.quantity;

        item.offerDiscount = totalItemDiscount;
        item.finalPrice = totalItemFinal;

        // SAFE OFFER ATTACH - Cart flow
        if (offerResult.bestOffer) {
          item.appliedOffer = {
            title: offerResult.bestOffer.title,
            value: offerResult.bestOffer.discountValue,
            discount: totalItemDiscount,
          };
        } else {
          item.appliedOffer = null;
        }

        offerDiscountTotal += totalItemDiscount;
        finalAmount += totalItemFinal;
      }

      // Add shipping if applicable
      if (finalAmount < FREE_SHIPPING_LIMIT) {
        shipping = 50;
        finalAmount += shipping;
      }
    }

    // ======================
    // FIXED BUY NOW FLOW - WITH PROPER appliedOffer STRUCTURE
    // ======================
    else {
      // Get the variant with product details
      req.session.buyNow = true;
      const variantData = await variantModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(variantId) } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $addFields: {
            mainImage: {
              $first: {
                $filter: {
                  input: "$product.productImages",
                  as: "img",
                  cond: { $eq: ["$$img.isMain", true] },
                },
              },
            },
          },
        },
      ]);

      if (!variantData.length) {
        return res.redirect("/products");
      }

      const variant = variantData[0];
      // VALIDATION: Check product block, listing status, and stock
      if (variant.product.isBlock || !variant.isListed || variant.stock < 1) {
        return res.redirect(
          "/product/" +
            variant.product._id +
            "/detials?error=Product unavailable",
        );
      }

      req.session.variantId = variant._id;

      // Create item object that EXACTLY matches cart flow structure
      const item = {
        product: variant.product,
        variant: {
          orgPrice: variant.orgPrice,
          salePrice: variant.salePrice,
          deviceModel: variant.deviceModel,
          stock: variant.stock,
          _id: variant._id,
        },
        quantity: 1,
        mainImage: variant.mainImage,
        orgPrice: variant.orgPrice,
      };

      console.log("Buy Now Item Structure:", {
        hasVariant: !!item.variant,
        variantOrgPrice: item.variant?.orgPrice,
        productName: item.product?.name,
      });

      // Calculate original subtotal
      subtotal = item.orgPrice;

      // Calculate best offer for this single item
      const offerResult = await calculateBestItemOffer({
        product: item.product,
        variant: item.variant,
        quantity: 1,
      });

      // Set item properties
      item.offerDiscount = offerResult.discountAmount;
      item.finalPrice = offerResult.finalPrice;

      // FIXED: Proper appliedOffer structure matching cart flow
      if (offerResult.bestOffer) {
        item.appliedOffer = {
          title: offerResult.bestOffer.title,
          value: offerResult.bestOffer.discountValue,
          discount: offerResult.discountAmount, // Use discountAmount directly
        };
        console.log("Applied Offer Set:", item.appliedOffer);
      } else {
        item.appliedOffer = null;
        console.log("No Applied Offer");
      }

      // Update totals
      offerDiscountTotal = offerResult.discountAmount;
      finalAmount = offerResult.finalPrice;

      // Add shipping if applicable
      if (finalAmount < FREE_SHIPPING_LIMIT) {
        shipping = 50;
        finalAmount += shipping;
      }

      // Create cartItems array with the single item
      cartItems = [item];
    }
    let cod = finalAmount > 1000 ? true : false;
    console.log("it is the coee" + cod);
    let walletButton = false;
    if (walletBalance?.balance > finalAmount) {
      walletButton = true;
    }

    const addresses = await addressModel.find({ userId });

    // Debug logs to verify both flows work the same
    console.log("========= CHECKOUT DATA =========");
    console.log("Flow Type:", type || "cart");
    console.log("Subtotal (Org Total):", subtotal);
    console.log("Offer Discount Total:", offerDiscountTotal);
    console.log("Subtotal after offers:", subtotal - offerDiscountTotal);
    console.log("Shipping:", shipping);
    console.log("Final Amount:", finalAmount);
    console.log("Items Count:", cartItems.length);

    if (cartItems.length > 0) {
      console.log("First Item Structure:");
      console.log(
        "  - Has variant.orgPrice:",
        !!cartItems[0].variant?.orgPrice,
      );
      console.log("  - variant.orgPrice:", cartItems[0].variant?.orgPrice);
      console.log("  - finalPrice:", cartItems[0].finalPrice);
      console.log("  - offerDiscount:", cartItems[0].offerDiscount);
      console.log("  - has appliedOffer:", !!cartItems[0].appliedOffer);
      if (cartItems[0].appliedOffer) {
        console.log("  - appliedOffer.title:", cartItems[0].appliedOffer.title);
        console.log("  - appliedOffer.value:", cartItems[0].appliedOffer.value);
        console.log(
          "  - appliedOffer.discount:",
          cartItems[0].appliedOffer.discount,
        );
      }
    }
    console.log("=================================");

    res.render("./user/checkout", {
      addresses,
      cartItems,
      subtotal,
      offerDiscountTotal,
      shipping,
      finalAmount,
      coupons,
      walletButton,
      cod,
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).send("Checkout error");
  }
};
export default {
  getCheckout,
};
