import productModel from "../../models/admin/productModel.js";
import offerModel from "../../models/admin/offerModel.js";
import Category from "../../models/admin/categoryModel.js";
import wishlistModel from "../../models/wishlistModel.js";
import variantModel from "../../models/admin/variantModel.js";
import mongoose from "mongoose";
import discountChecker from "../../utils/calculateDiscount.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { uploadBufferTocloudnery } from "../../utils/cloudneryUpload.js";
// ==============================
// PRODUCT LIST WITH FILTER & SEARCH
// ==============================
// - Pagination
// - Category filter
// - Search by product name
const getProductList = async (req, res) => {
  const limit = 6;
  const filter = (req.query.filter || "Select Category").trim();
  const search = (req.query.search || "").trim();

  const page = parseInt(req.query.page) || 1;

  let searchFilter = {};

  if (search !== "") {
    searchFilter.name = { $regex: search, $options: "i" };
  }

  if (filter !== "Select Category") {
    const category = await Category.findOne({ name: filter });

    if (category) {
      searchFilter.catgId = category._id;
    }
  }

  const currentPage = page;
  const totalItems = await productModel.find(searchFilter).countDocuments();
  const products = await productModel
    .find(searchFilter)
    .populate("variants")
    .populate("catgId")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  console.log(page, "it page number");
  let totalStock;
  products.forEach((product) => {
    totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
  });

  const categories = await Category.find();
  const totalPages = Math.ceil(totalItems / limit);
  res.render("./admin/product-list", {
    products,
    categories,
    currentPage,
    totalPages,
    totalItems,
    search,
    selectionFilter: filter,
    totalStock,
  });
};

// ==============================
// ADD PRODUCT PAGE
// ==============================
// Fetch categories and render product creation page
const getAddproduct = async (req, res) => {
  const categories = await Category.find();
  res.render("./admin/add-product-&-variant", {
    categories,
  });
};

// ==============================
// GET PRODUCT LIST
// ==============================
// Handles:
// - Search
// - Category filter
// - Price filter
// - Sorting
// - Pagination
// - Wishlist marking

// ==============================
// GET PRODUCT EDIT PAGE
// ==============================
// Fetch product details along with category & variants
// Used to render edit-product page
const getProductEdit = async (req, res) => {
  const id = req.params.id;
  const objectId = new mongoose.Types.ObjectId(id);
  const product = await productModel
    .findOne({ _id: objectId })
    .populate("catgId")
    .populate("variants");
  const categories = await Category.find();
  res.render("./admin/edit-product", {
    product,
    categories,
  });
};

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
              cond: { $gt: ["$$v.stock", 0] },
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
        const offers = await offerModel.aggregate([
          {
            $match: {
              status: "active",
              startDate: { $lte: today },
              endDate: { $gte: today },
            },
          },
          {
            $match: {
              $or: [
                { applicableOn: "global" },
                {
                  applicableOn: "product",
                  productIds: { $in: [p._id] },
                },
                {
                  applicableOn: "category",
                  categoryIds: { $in: [p.catgId._id] },
                },
              ],
            },
          },
          {
            $project: {
              discountValue: 1,
              offerType: 1,
              title: 1,
              categoryIds: 1,
              productIds: 1,
              applicableOn: 1,
              minimumOrderValue: 1,
            },
          },
        ]);

        const price = p.minVariant.orgPrice;
        const currentDiscount = price - p.minVariant.salePrice;

        let bestOfferDiscount = 0;
        let bestOffer = null;

        for (let offer of offers) {
          if (offer.discountValue >= price) continue;
          let discountAmount = 0;
          if (offer.offerType === "percentage") {
            discountAmount = price - price * (offer.discountValue / 100);

            // Apply maximumDiscount cap if explicitly set
            if (offer.maximumDiscount && offer.maximumDiscount > 0) {
              if (discountAmount > offer.maximumDiscount) {
                discountAmount = offer.maximumDiscount;
              }
            }
          } else {
            discountAmount = Math.min(offer.discountValue, price);
          }

          if (discountAmount > bestOfferDiscount) {
            bestOfferDiscount = discountAmount;
            bestOffer = offer;
          }
        }

        let appliedDiscount = currentDiscount;
        if (bestOfferDiscount > currentDiscount) {
          appliedDiscount = bestOfferDiscount;
        } else {
          bestOffer = null; // Discard offer if it doesn't beat the existing sale price
        }

        return {
          ...p,
          offerType: bestOffer?.offerType || null,
          offerValue: bestOffer?.discountValue || 0,
          offerName: bestOffer?.title || null,
          bestDiscount: appliedDiscount,
          salePrice: price - appliedDiscount,
        };
      }),
    );
    console.log(products);

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
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

// ==============================
// ADD PRODUCT WITH VARIANTS & IMAGES
// ==============================
// - Minimum 3 images validation
// - Upload images to Cloudinary
// - Create product & variants
const postAddproduct = async (req, res) => {
  try {
    if (req.files.length < 3) {
      return res.status(400).json({
        success: false,
        message: "upload minimum three images",
      });
    } else {
      const {
        productName,
        description,
        category,
        status,
        devices,
        mainImageIndex,
      } = req.body;
      const existing = await productModel.findOne({ name: productName });
      if (!existing) {
        const uploadResults = await Promise.all(
          req.files.map((file) => uploadBufferTocloudnery(file.buffer)),
        );
        const productImgUrls = uploadResults.map((upload, index) => ({
          url: upload.secure_url,
          publicId: upload.public_id,
          isMain: Number(mainImageIndex) === index,
        }));

        const newProduct = await productModel.create({
          name: productName,
          description: description,
          productStatus: status === "active" ? true : false,
          catgId: new mongoose.Types.ObjectId(category),
          productImages: productImgUrls,
        });
        const parsedDevices = JSON.parse(devices);
        const variants = await variantModel.insertMany(
          parsedDevices.map((v) => ({
            productId: newProduct._id,
            deviceModel: v.name,
            orgPrice: v.originalPrice,
            salePrice: v.salePrice,
            stock: v.stock,
            discount: v.discount,
          })),
        );
        newProduct.variants = variants.map((v) => {
          return v._id;
        });
        await newProduct.save();

        return res.status(200).json({
          success: true,
          message: "Product uploading  Successfully",
          redirectUrl: "/admin/product-list",
          data: newProduct,
        });
      } else {
        console.log("already exist");
        return res.status(409).json({
          success: false,
          message: "Product already existing",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};
// ==============================
// EDIT PRODUCT IMAGE
// ==============================
// Replace an existing product image
const productImageEdit = async (req, res) => {
  try {
    const { imageId } = req.body;
    const productId = req.params.id;
    const objectId = new mongoose.Types.ObjectId(productId);
    const existing = await productModel.findOne({ _id: objectId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "product not exists",
      });
    }
    const index = existing.productImages.findIndex((img) => {
      return img._id == imageId;
    });
    if (index === -1) {
      return res.send(404).json({
        success: false,
        message: "image not founded ",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "no image selected ",
      });
    }
    const cloudUrl = await uploadBufferTocloudnery(req.file.buffer);
    existing.productImages[index].url = cloudUrl.secure_url;
    await existing.save();
    return res.status(200).json({
      success: true,
      message: "Product Image updated",
    });
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// GET PRODUCT DETAIL PAGE
// ==============================
// Fetches a single product with category & variants
// Also loads up to 4 related products
const getDetialProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const product = await productModel
      .findById(objectId)
      .populate("catgId")
      .populate("variants");

    let relatedProducts = await productModel
      .find({ catgId: product.catgId, _id: { $ne: product._id } })
      .limit(4);
    if (relatedProducts.length < 4) {
      const remains = 4 - relatedProducts.length;
      const excludeCatgIds = [
        product._id,
        ...relatedProducts.map((id) => id.catgId._id),
      ];
      const defCatgProduct = await productModel
        .find({
          catgId: { $ne: product.catgId },
          _id: { $nin: excludeCatgIds },
        })
        .limit(remains);
      relatedProducts = [...relatedProducts, ...defCatgProduct];
    }

    console.log("last");
    res.render("./user/product-detial", {
      product,
      relatedProducts,
    });
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// GET VARIANT PRICE DATA (AJAX)
// ==============================
// Used when user switches variant (color / model)
// Returns updated prices dynamically
const getVariantData = async (req, res) => {
  try {
    const today = new Date();
    const productId = req.params.id;
    const variantId = req.query.variantId;
    let currentDiscount = 0;
    if (!productId || !variantId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "productId or variantId not provided",
      });
    }
    const variant = await variantModel.findOne({ _id: variantId });
    if (!variant) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "variant not founded",
      });
    }

    //offer showining in product detial page
    const product = await productModel
      .findById(productId)
      .populate("catgId")
      .populate("variants");
    const offers = await offerModel.aggregate([
      {
        $match: {
          status: "active",
          startDate: { $lte: today },
          endDate: { $gte: today },
        },
      },
      {
        $match: {
          $or: [
            { applicableOn: "global" },
            {
              applicableOn: "product",
              productIds: product._id,
            },
            {
              applicableOn: "category",
              categoryIds: product.catgId?._id,
            },
          ],
        },
      },
      {
        $project: {
          applicableOn: 1,
          categoryIds: 1,
          productIds: 1,
        },
      },
    ]);

    currentDiscount = variant.orgPrice - variant.salePrice;
    let disObject = { bestDiscount: 0, isOffer: false };
    let salePrice;

    if (offers.length !== 0) {
      let combinedOffers = offers.filter((v) =>
        ["product", "category"].includes(v.applicableOn),
      );

      let offerType = "offerType";
      //  passing argugemnts are mentioned inside of the of the discountChecker
      disObject = await discountChecker(
        combinedOffers,
        offerModel,
        variant.orgPrice,
        offerType,
      );
    }
    salePrice = variant.salePrice;
    disObject.isOffer = false;

    if (offers.length !== 0 && disObject.bestDiscount > currentDiscount) {
      // Offer is better than the built-in sale discount
      salePrice = Math.floor(variant.orgPrice - disObject.bestDiscount);
      disObject.isOffer = true;
    } else {
      // Sale price is better or equal
      salePrice = variant.salePrice;
      disObject.bestDiscount = currentDiscount; // Sync the value conceptually
      disObject.isOffer = false;
    }

    const orgPrice = variant.orgPrice;
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "success",
      salePrice,
      orgPrice,
      disObject,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

// ==============================
// BLOCK / UNBLOCK PRODUCT
// ==============================
// Toggles product visibility
// Used to hide or show product in user side
const blockProduct = async (req, res) => {
  try {
    let id = req.params.id;

    const objectId = new mongoose.Types.ObjectId(id);
    const existing = await productModel.findOne({ _id: objectId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Not Founded",
      });
    } else {
      console.log(existing.isBlock);
      if (existing.isBlock) {
        existing.isBlock = false;
        await existing.save();
      } else {
        existing.isBlock = true;
        await existing.save();
      }
      console.log(existing.isBlock);
      return res.status(200).json({
        success: true,
        message: `${existing.isBlock ? "block" : "unblock"}`,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
// ==============================
// SET MAIN PRODUCT IMAGE
// ==============================
// Marks selected image as main image
// Only one main image allowed
const imgSetMain = async (req, res) => {
  try {
    const proudctId = req.params.id;
    const objectId = new mongoose.Types.ObjectId(proudctId);
    const { imgIndx } = req.body;
    const existing = await productModel.findOne({ _id: objectId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "product not exists",
      });
    }
    for (let i = 0; i < existing.productImages.length; i++) {
      if (i === Number(imgIndx) - 1) {
        if (existing.productImages[i].isMain !== true) {
          const existMainRemove = existing.productImages.findIndex(
            (img) => img.isMain === true,
          );
          existing.productImages[existMainRemove].isMain = false;
          existing.productImages[i].isMain = true;
          await existing.save();
          return res.status(200).json({
            success: true,
            message: "successfully setmain",
          });
        } else {
          return res.status(208).json({
            success: false,
            message: "it's already done ,no change",
          });
        }
      }
    }
  } catch (error) {
    error;
  }
};

// ==============================
// ADD PRODUCT IMAGE
// ==============================
// Upload additional product images (max limit: 5)
// Image stored in Cloudinary
const productImageUpload = async (req, res) => {
  try {
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const existing = await productModel.findById(objectId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "product not exists",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image not selected",
      });
    }
    if (existing.productImages.length < 5) {
      const cloudUrl = await uploadBufferTocloudnery(req.file.buffer);
      existing.productImages.push({
        url: cloudUrl.secure_url,
        publicId: cloudUrl.public_id,
        isMain: false,
      });
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Image added",
      });
    } else {
      return res.status(429).json({
        success: false,
        message: "Upload limit reached. Try again later.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// DELETE PRODUCT IMAGE
// ==============================
// Deletes image except main image
const editImgDelete = async (req, res) => {
  try {
    const Id = req.params.id;
    const { id } = req.body;
    const objectId = new mongoose.Types.ObjectId(Id);
    const existing = await productModel.findOne({ _id: objectId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "product not exists",
      });
    }
    const index = existing.productImages.findIndex(
      (v) => v._id.toString() === id,
    );
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not founded",
      });
    }
    if (existing.productImages[index].isMain !== true) {
      existing.productImages.splice(index, 1);
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Image deleted !",
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "It's main you couldn't delete this Image",
      });
    }
  } catch (error) {}
};
// ==============================
// UPDATE PRODUCT BASIC INFO
// ==============================
// Update product name, category, and description
const editProductBasicInformation = async (req, res) => {
  try {
    const id = req.params.id;
    const productId = new mongoose.Types.ObjectId(id);
    const { productName, category, description } = req.body;
    const categoryId = new mongoose.Types.ObjectId(category);
    const existing = await productModel.findById(productId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not exists",
      });
    }
    const result = await productModel.findByIdAndUpdate(
      productId,
      {
        name: productName,
        description: description,
        catgId: categoryId,
      },
      {
        new: true,
      },
    );
    let flag = false;
    if (existing.name !== result.name) {
      flag = true;
    }
    if (existing.description !== result.description) {
      flag = true;
    }
    if (existing.catgId.toString() !== result.catgId.toString()) {
      flag = true;
    }
    if (flag) {
      return res.status(200).json({
        success: true,
        message: "product info updated!",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
// ==============================
// FETCH VARIANT DATA
// ==============================
// Used for editing variant via modal
const passVariantData = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const objectId = new mongoose.Types.ObjectId(id);
    const variant = await variantModel.findById(objectId);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      variant,
    });
  } catch (error) {
    console.log(error);
  }
};
// ==============================
// UPDATE VARIANT DETAILS
// ==============================
// Validates price logic and updates variant
const postEditVariantSave = async (req, res) => {
  try {
    const { deviceModel, stock, orgPrice, salePrice } = req.body;
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const existing = await variantModel.findById(objectId);
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "variant not founded",
      });
    }
    if (+orgPrice < +salePrice) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than original price",
      });
    }

    let result = await variantModel.findByIdAndUpdate(
      objectId,
      {
        deviceModel: deviceModel,
        stock: stock,
        orgPrice: orgPrice,
        salePrice: salePrice,
      },
      { new: true },
    );
    console.log(result);
    let isflag = false;
    if (existing.deviceModel !== result.deviceModel) {
      isflag = true;
    }
    if (existing.stock !== result.stock) {
      isflag = true;
    }
    if (existing.orgPrice !== result.orgPrice) {
      isflag = true;
    }
    if (existing.salePrice !== result.salePrice) {
      isflag = true;
    }
    if (isflag) {
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: "variant updated",
      });
    }
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "server side error",
    });
  }
};
// ==============================
// LIST / UNLIST VARIANT
// ==============================
// Controls variant availability in user side
const patchListUnlist = async (req, res) => {
  try {
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const existing = await variantModel.findById(objectId);
    if (!existing) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "veriant not founded",
      });
    }
    if (existing.isListed) {
      existing.isListed = false;
      await existing.save();
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Unlisted",
      });
    } else {
      existing.isListed = true;
      await existing.save();
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: "listed",
      });
    }
  } catch (error) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "server down!",
    });
  }
};
export default {
  getProductList,
  getAddproduct,
  getProductEdit,
  getProduct,
  postAddproduct,
  productImageEdit,
  getDetialProduct,
  getVariantData,
  blockProduct,
  imgSetMain,
  productImageUpload,
  editImgDelete,
  editProductBasicInformation,
  passVariantData,
  postEditVariantSave,
  patchListUnlist,
};
