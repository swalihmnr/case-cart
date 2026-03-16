import Category from "../../models/admin/categoryModel.js";
import mongoose from "mongoose";
// List categories with pagination and search
const getCategory = async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  let searchFilter = {};
  if (search !== "") {
    searchFilter = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };
  }

  const limit = 9;
  const skip = (page - 1) * limit;

  const categories = await Category.find(searchFilter)
    .skip(skip)
    .limit(limit)
    .lean();
  const totalItems = await Category.find(searchFilter).countDocuments();
  const totalPages = Math.ceil(totalItems / limit);
  let currentPage = page;
  res.render("./admin/category-list", {
    categories,
    totalItems,
    totalPages,
    skip,
    page,
    limit,
    currentPage,
    search,
  });
};

// Create new category
// Prevent duplicate category names
const postCategory = async (req, res) => {
  res.render("./admin/list-category");
};

//Render add category
const getAddCategory = (req, res) => {
  res.render("./admin/add-category");
};

// ==============================
// ADD CATEGORY (POST)
// ==============================
// Creates a new category
// - Prevents duplicate category names
// - Supports "Save" and "Save & Add Another" actions
const postAddCategory = async (req, res) => {
  try {
    let { categoryName, categoryDescription, action } = req.body;

    if (!categoryName || !categoryDescription) {
      return res.status(400).json({
        success: false,
        message: "Category name and description are required",
      });
    }

    const cleanName = categoryName.trim();
    const cleanDescription = categoryDescription.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot be empty",
      });
    }

    const nameRegex = /^[a-zA-Z0-9\s\-]{3,50}$/;

    if (!nameRegex.test(cleanName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category name format",
      });
    }

    if (cleanDescription.length < 5 || cleanDescription.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Description must be between 5 and 200 characters",
      });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const newCategory = new Category({
      name: cleanName,
      description: cleanDescription,
      isActive: true,
    });

    await newCategory.save();

    return res.status(200).json({
      success: true,
      message: "Category saved successfully",
      redirectUrl:
        action === "save" ? "/admin/category" : "/admin/add-category",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ==============================
// BLOCK / UNBLOCK CATEGORY
// ==============================
// Toggles category active status
// Used to hide or show category in user side
const blockCategory = async (req, res) => {
  try {
    let id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid category.");
      return res.redirect("/admin/category");
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const existing = await Category.findOne({ _id: objectId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Not Founded",
      });
    } else {
      console.log(existing.isActive);
      if (existing.isActive) {
        existing.isActive = false;
        await existing.save();
      } else {
        existing.isActive = true;
        await existing.save();
      }
      console.log(existing.isActive);
      return res.status(200).json({
        success: `${existing.isActive ? "Unblocked" : "Blocked"}`,
        status: existing.isActive,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// ==============================
// GET EDIT CATEGORY PAGE
// ==============================
// Fetch category by ID and render edit page
const editCategory = async (req, res) => {
  let id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Invalid category.");
    return res.redirect("/admin/category");
  }
  const objectId = new mongoose.Types.ObjectId(id);
  let category = await Category.findOne({ _id: objectId });
  if (!category) {
    req.flash("error", "Category not found");
    return res.redirect("/admin/category");
  }
  res.render("admin/admin-edit-category", { category });
};

// ==============================
// UPDATE CATEGORY
// ==============================
// - Prevents duplicate names
// - Avoids unnecessary updates
const postEditCategory = async (req, res) => {
  try {
    const { categoryName, categoryDescription } = req.body;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const cleanName = categoryName.trim();
    const cleanDescription = categoryDescription.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot be empty",
      });
    }

    const existing = await Category.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 🔹 Duplicate check
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    // 🔹 Check if nothing changed
    if (
      existing.name === cleanName &&
      existing.description === cleanDescription
    ) {
      return res.status(304).json({
        success: false,
        message: "No changes detected",
      });
    }

    await Category.findByIdAndUpdate(id, {
      name: cleanName,
      description: cleanDescription,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      redirectUrl: "/admin/category",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default {
  getCategory,
  postCategory,
  getAddCategory,
  postAddCategory,
  blockCategory,
  editCategory,
  postEditCategory,
};
