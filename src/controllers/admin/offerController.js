import { STATUS_CODES } from "../../utils/statusCodes.js";
import offerModel from "../../models/admin/offerModel.js";
import idFinder from "../../utils/idFinder.js";
import Category from "../../models/admin/categoryModel.js";
import Product from "../../models/admin/productModel.js";
import mongoose from "mongoose";

// =========================
// LIST OFFERS (PAGINATION + FILTER + SEARCH)
// =========================
const renderOffersPage = async (req, res) => {
  try {
    // =========================
    // QUERY PARAMS
    // =========================
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const filter = req.query.filter || "all";

    const limit = 8;
    const skip = (page - 1) * limit;

    const productId = req.query.productId || null;
    const categoryId = req.query.categoryId || null;

    // Validate productId
    if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
      req.flash("error", "Invalid product selected.");
      return res.redirect("/admin/offers");
    }

    // Validate categoryId
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      req.flash("error", "Invalid category selected.");
      return res.redirect("/admin/offers");
    }

    // =========================
    // PASS FROM URL DATA
    // =========================
    let passFromUrl = {};

    if (productId) {
      const product = await Product.findById(productId);
      passFromUrl = {
        id: product?._id || null,
        URLID: productId,
        item: "Product",
        name: product?.name || "Not Found",
      };
    } else if (categoryId) {
      const category = await Category.findById(categoryId);
      passFromUrl = {
        id: category?._id || null,
        URLID: categoryId,
        item: "Category",
        name: category?.name || "Not Found",
      };
    }

    // =========================
    // FILTER + SEARCH QUERY
    // =========================
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Status filter
    if (filter === "active") {
      query.status = "active";
    }

    if (filter === "scheduled") {
      query.status = "scheduled";
    }

    if (filter === "inactive") {
      query.status = "inactive";
    }

    // =========================
    // PAGINATED OFFERS
    // =========================
    const offers = await offerModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // =========================
    // TOTAL PAGES
    // =========================
    const totalOffers = await offerModel.countDocuments(query);
    const totalPages = Math.ceil(totalOffers / limit);

    // =========================
    // STATUS COUNTS
    // =========================
    const result = await offerModel.aggregate([
      {
        $facet: {
          activeCount: [{ $match: { status: "active" } }, { $count: "count" }],
          scheduledCount: [
            { $match: { status: "scheduled" } },
            { $count: "count" },
          ],
          inactiveCount: [
            { $match: { status: "inactive" } },
            { $count: "count" },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const data = result[0];

    const activeOfferCount = data.activeCount[0]?.count || 0;
    const sheduledOfferCount = data.scheduledCount[0]?.count || 0;
    const inactiveOfferCount = data.inactiveCount[0]?.count || 0;
    const totalOffersCount = data.totalCount[0]?.count || 0;

    // =========================
    // RENDER
    // =========================
    return res.render("./admin/offer-listing", {
      now: new Date(),
      offers,
      activeOfferCount,
      sheduledOfferCount,
      inactiveOfferCount,
      totalOffersCount,
      passFromUrl,
      currentPage: page,
      totalPages,
      search,
      filter,
    });
  } catch (error) {
    console.error("Offer Page Error:", error);
    res.status(500).send("Server Error");
  }
};

// =========================
// ADD OFFER
// =========================
const renderOfferAdd = async (req, res) => {
  console.log("entered");
  let schemaModel;
  if (req.query.item === "Product") {
    schemaModel = Product;
  } else {
    schemaModel = Category;
  }
  console.log("entered1");
  let response = await idFinder(schemaModel, req.query.id);
  let passFromUrl = {};
  console.log("entered2");
  if (response) {
    passFromUrl.name = response?.name || null;
  }
  const category = await Category.find();
  const products = await Product.find();
  console.log(passFromUrl);
  return res.render("./admin/offer-add", {
    category,
    products,
    passFromUrl,
  });
};

const postOfferAdd = async (req, res) => {
  try {
    console.log(req.body);
    const {
      title,
      description,
      offerType,
      offerValue,
      maximumDiscountValue,
      applicableOn,
      startDate,
      endDate,
      productIds,
      categoryIds,
    } = req.body;
    if (
      !title ||
      !offerType ||
      !offerValue ||
      !applicableOn ||
      !startDate ||
      !endDate
    ) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: "some fields are missing",
      });
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: "Invalid date",
        });
      }
      if (isNaN(start.getTime())) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: "Invalid date",
        });
      }
      console.log("hlow");
      const existing = await offerModel.findOne({
        title: { $regex: new RegExp(`^${title.trim()}$`, "i") }
      });
      if (existing) {
        return res.status(STATUS_CODES.CONFLICT).json({
          success: false,
          message: "An offer with this title already exists!",
        });
      }
      const offerData = {
        title,
        description,
        offerType,
        discountValue: offerValue,
        maximumDiscount: maximumDiscountValue,
        applicableOn,
        startDate,
        endDate,
      };
      if (applicableOn === "category") {
        if (categoryIds.length === 0) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: `You must add items belong to ${applicableOn}`,
          });
        }
        offerData.categoryIds = categoryIds.map((id) => {
          return new mongoose.Types.ObjectId(id);
        });
      }
      if (applicableOn === "product") {
        if (productIds.length === 0) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: `You must add items belong to ${applicableOn}`,
          });
        }
        offerData.productIds = productIds.map((id) => {
          return new mongoose.Types.ObjectId(id);
        });
      }
      await offerModel.create(offerData);
      return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: "Offer Created successfully",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error!",
    });
  }
};

// =========================
// EDIT OFFER
// =========================
const renderOfferEdit = async (req, res) => {
  try {
    const response = {};
    const id = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid offer ID.");
      return res.redirect("/admin/offers");
    }

    const offerId = new mongoose.Types.ObjectId(id);
    response.type = null;
    response.data = null;

    if (req.query.item && req.query.itemId) {
      let schemaModel;

      if (req.query.item === "Product") {
        response.type = "product";
        schemaModel = Product;
      } else if (req.query.item === "Category") {
        response.type = "category";
        schemaModel = Category;
      }

      if (schemaModel) {
        response.data = await idFinder(schemaModel, req.query.itemId);
      }
    }

    const offer = await offerModel
      .findById(offerId)
      .populate("productIds")
      .populate("categoryIds");
    console.log(req.query.id);
    console.log(offer);
    const products = await Product.find({ isBlock: false });
    console.log("it  is the product", products);
    const categories = await Category.find();

    return res.render("./admin/offer-edit", {
      offer,
      products,
      categories,
      response,
    });
  } catch (err) {
    console.error("Render edit error:", err);
    return res.redirect("/admin/offers");
  }
};
const postEditOffer = async (req, res) => {
  try {
    console.log(req.body);

    const {
      offerId,
      title,
      description,
      offerType,
      offerValue,
      maximumDiscountValue,
      applicableOn,
      startDate,
      endDate,
      productIds,
      categoryIds,
      status,
    } = req.body;
    console.log(offerId);
    if (
      !offerId ||
      !title ||
      !description ||
      !offerType ||
      !offerValue ||
      !applicableOn ||
      !startDate ||
      !endDate
    ) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: "Missing required fields" });
    }

    let offerDataToUpdate = {
      title,
      description,
      offerType,
      discountValue: offerValue,
      maximumDiscount: maximumDiscountValue,
      applicableOn,
      startDate,
      endDate,
      status,
    };

    // Check for duplicate title (excluding current offer)
    const existing = await offerModel.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
      _id: { $ne: new mongoose.Types.ObjectId(offerId) }
    });

    if (existing) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: "Another offer with this title already exists!"
      });
    }
    if (applicableOn === "category") {
      if (categoryIds.length === 0) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
          success: false,
          message: `You must add items belong to ${applicableOn}`,
        });
      }
      offerDataToUpdate.categoryIds = categoryIds.map((id) => {
        return new mongoose.Types.ObjectId(id);
      });
    }
    if (applicableOn === "product") {
      if (productIds.length === 0) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
          success: false,
          message: `You must add items belong to ${applicableOn}`,
        });
      }
      offerDataToUpdate.productIds = productIds.map((id) => {
        return new mongoose.Types.ObjectId(id);
      });
    }
    if (applicableOn === "global") {
      offerDataToUpdate.productIds = [];
      offerDataToUpdate.categoryIds = [];
    }
    const updatedData = await offerModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(offerId),
      offerDataToUpdate,
      { new: true, runValidators: true },
    );
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Offer udpdated Successfully",
    });
  } catch (error) {
    console.log(error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error",
    });
  }
};

// =========================
// DELETE OFFER
// =========================
const deleteOffer = async (req, res) => {
  try {
    const offerId = new mongoose.Types.ObjectId(req.params.id);
    const response = await offerModel.findByIdAndDelete(offerId);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Offer deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error",
    });
  }
};

export default {
  renderOffersPage,
  renderOfferAdd,
  postOfferAdd,
  renderOfferEdit,
  postEditOffer,
  deleteOffer,
};
