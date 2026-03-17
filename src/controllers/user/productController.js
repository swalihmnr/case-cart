import productModel from "../../models/admin/productModel.js";
import offerModel from "../../models/admin/offerModel.js";
import Category from "../../models/admin/categoryModel.js";
import wishlistModel from "../../models/wishlistModel.js";
import variantModel from "../../models/admin/variantModel.js";
import mongoose from "mongoose";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import discountChecker from "../../utils/calculateDiscount.js";
import calculateBestItemOffer from "../../utils/calculateBestOfferItem.js";

// ==============================
// GET ALL PRODUCTS (USER SIDE)
// ==============================
const getProduct = async (req, res) => {
  try {
    let {
      page = 1,
      search = "",
      price = "all",
      Categories = "",
      sort = "",
    } = req.query;
    page = Number(page);

    const limit = 6;
    const skip = (page - 1) * limit;

    const selectedCategories = Categories
      ? Categories.split(",").filter(Boolean)
      : [];

    let matchStage = { isBlock: false };

    if (search.trim()) {
      matchStage.name = { $regex: search, $options: "i" };
    }

    if (selectedCategories.length > 0) {
      matchStage.catgId = {
        $in: selectedCategories.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    // PRICE FILTER
    let priceFilter = {};
    if (price === "under-150") {
      priceFilter = { minPrice: { $lte: 150 } };
    }
    if (price === "500-700") {
      priceFilter = { minPrice: { $gte: 500, $lte: 700 } };
    }
    if (price === "above-1000") {
      priceFilter = { minPrice: { $gte: 1000 } };
    }

    // SORT LOGIC
    let sortStage = { createdAt: -1 };
    if (sort === "priceLowHigh") sortStage = { minPrice: 1 };
    if (sort === "priceHighLow") sortStage = { minPrice: -1 };
    if (sort === "aToZ") sortStage = { name: 1 };
    if (sort === "zToA") sortStage = { name: -1 };

    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "variants",
          localField: "variants",
          foreignField: "_id",
          as: "variants",
        },
      },
      {
        $addFields: {
          variants: {
            $filter: {
              input: "$variants",
              as: "v",
              cond: {
                $and: [
                  { $gt: ["$$v.stock", 0] },
                  { $eq: ["$$v.isListed", true] },
                ],
              },
            },
          },
        },
      },
      { $match: { "variants.0": { $exists: true } } },

      // JOIN CATEGORY
      {
        $lookup: {
          from: "categories",
          localField: "catgId",
          foreignField: "_id",
          as: "catgId",
        },
      },
      { $unwind: "$catgId" },
      { $match: { "catgId.isActive": true } },

      // ADD MIN PRICE & MAIN IMAGE
      {
        $addFields: {
          minPrice: { $min: "$variants.salePrice" },
          minVariant: {
            $first: {
              $sortArray: {
                input: "$variants",
                sortBy: { salePrice: 1 },
              },
            },
          },
          mainImage: {
            $first: {
              $filter: {
                input: "$productImages",
                as: "img",
                cond: { $eq: ["$$img.isMain", true] },
              },
            },
          },
        },
      },

      // PRICE FILTER
      ...(Object.keys(priceFilter).length > 0 ? [{ $match: priceFilter }] : []),
    ];

    // APPLY SORT ONLY IF NOT EMPTY
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // PAGINATION + COUNT IN SINGLE CALL
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await productModel.aggregate(pipeline);
    let wishlistItems = [];
    let user = false;
    const today = new Date();

    const products = await Promise.all(
      result[0].data.map(async (p) => {
        const offerResult = await calculateBestItemOffer({
          product: p,
          variant: p.minVariant,
          quantity: 1,
        });

        return {
          ...p,
          offerType: offerResult.bestOffer?.offerType || null,
          offerValue: offerResult.bestOffer?.discountValue || 0,
          offerName: offerResult.bestOffer?.title || null,
          bestDiscount: offerResult.discountAmount,
          salePrice: offerResult.finalPrice,
        };
      }),
    );

    const totalItems = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    if (req.session.user?.id) {
      user = true;
    }
    const categories = await Category.find({ isActive: true });
    if (req.session.user?.id) {
      wishlistItems = await wishlistModel.find({ userId: req.session.user.id });
    }
    res.render("user/product-list", {
      products,
      categories,
      selectedCategories,
      search,
      price,
      sort,
      totalItems,
      currentPage: page,
      totalPages,
      wishlistItems,
      user:req.session.user
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

// ==============================
// GET PRODUCT DETAIL PAGE
// ==============================
const getDetialProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Product ID not valid");
      return res.redirect("/product");
    }
    const objectId = new mongoose.Types.ObjectId(id);
    const product = await productModel
      .findById(objectId)
      .populate("catgId")
      .populate("variants");
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/product");
    }

    const relatedProductsInitial = await productModel
      .find({ catgId: product.catgId, _id: { $ne: product._id } })
      .limit(4);

    const relatedProducts = [
      ...relatedProductsInitial,
      ...(relatedProductsInitial.length < 4
        ? await productModel
          .find({
            catgId: { $ne: product.catgId },
            _id: {
              $nin: [
                product._id,
                ...relatedProductsInitial.map((p) => p._id),
              ],
            },
          })
          .limit(4 - relatedProductsInitial.length)
        : []),
    ];

    // INITIAL OFFER CALCULATION
    const today = new Date();
    const defaultVariant = product.variants[0];
    let initialOffer = { bestDiscount: 0, isOffer: false };

    if (defaultVariant) {
      const offers = await offerModel.find({
        status: "active",
        startDate: { $lte: today },
        endDate: { $gte: today },
        $or: [
          { applicableOn: "global" },
          { applicableOn: "product", productIds: product._id },
          { applicableOn: "category", categoryIds: product.catgId?._id },
        ],
      });

      if (offers.length > 0) {
        const offerResult = await calculateBestItemOffer({
          product,
          variant: defaultVariant,
          quantity: 1,
        });

        if (offerResult.bestOffer) {
          initialOffer = {
            bestDiscount: offerResult.discountAmount,
            isOffer: true,
            name: offerResult.bestOffer.title,
            disType: offerResult.bestOffer.offerType === "percentage" ? "percentage" : "fixed",
            discountTypeValue: offerResult.bestOffer.discountValue,
            salePrice: offerResult.finalPrice,
          };
        }
      }
    }

    let wishlistItems = [];
    if (req.session.user?.id) {
      wishlistItems = await wishlistModel.find({ userId: req.session.user.id });
    }

    res.render("./user/product-detial", {
      product,
      relatedProducts,
      initialOffer,
      wishlistItems,
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// ==============================
// GET VARIANT DATA (AJAX)
// ==============================
const getVariantData = async (req, res) => {
  try {
    const today = new Date();
    const productId = req.params.id;
    const variantId = req.query.variantId;

    if (!productId || !variantId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "productId or variantId not provided",
      });
    }

    const variant = await variantModel.findById(variantId);
    const product = await productModel.findById(productId);

    if (!variant || !product) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Product or Variant not found",
      });
    }

    // Fetch all applicable offers
    const offers = await offerModel.find({
      status: "active",
      startDate: { $lte: today },
      endDate: { $gte: today },
      $or: [
        { applicableOn: "global" },
        { applicableOn: "product", productIds: product._id },
        { applicableOn: "category", categoryIds: product.catgId },
      ],
    });

    let disObject = { bestDiscount: 0, isOffer: false };
    let salePrice = variant.salePrice;

    if (offers.length > 0) {
      const offerResult = await calculateBestItemOffer({
        product,
        variant,
        quantity: 1,
      });

      if (offerResult.bestOffer) {
        disObject = {
          bestDiscount: offerResult.discountAmount,
          isOffer: true,
          name: offerResult.bestOffer.title,
          disType: offerResult.bestOffer.offerType === "percentage" ? "percentage" : "fixed",
          discountTypeValue: offerResult.bestOffer.discountValue,
        };
        salePrice = offerResult.finalPrice;
      }
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "success",
      salePrice,
      orgPrice: variant.orgPrice,
      stock: variant.stock,
      disObject,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default {
  getProduct,
  getDetialProduct,
  getVariantData,
};
