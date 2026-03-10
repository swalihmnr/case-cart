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
    const { categoryName, categoryDescription, action } = req.body;
    let existing = await Category.findOne({ name: categoryName });
    if (!existing) {
      let newCategory = new Category({
        name: categoryName,
        isActive: true,
        description: categoryDescription,
      });
      console.log("category saved");
      await newCategory.save();

      if (action === "save") {
        return res.status(200).json({
          success: true,
          message: "Category saved...",
          redirectUrl: "/admin/category",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Category saved...",
          redirectUrl: "/admin/add-category",
        });
      }
    } else {
      console.log("category already exists");
      return res.status(409).json({
        success: false,
        message: "category already exists",
      });
    }
  } catch (err) {
    console.log(err);
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
        success: true,
        message: `${existing.isActive ? "block" : "unblock"}`,
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
  if(!category){
    req.flash("error","Category not found")
    return res.redirect('/admin/category')
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
    console.log(req.body);
    const { categoryName, categoryDescription } = req.body;
    let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid category.");
      return res.redirect("/admin/category");
    }
    console.log(id);
    const existing = await Category.findOne({ _id: id });
    if (existing) {
      const isDuplecate = await Category.findOne({
        _id: { $ne: id },
        name: categoryName,
      });
      if (isDuplecate) {
        return res.status(409).json({
          success: false,
          message: "it's name already exist",
        });
      } else {
        if (
          existing.name === categoryName &&
          existing.description === categoryDescription
        ) {
          return res.status(304).json({
            success: false,
            message: "not detected",
          });
        }
        const updated = await Category.findByIdAndUpdate(
          id,
          {
            name: categoryName,
            description: categoryDescription,
          },
          {
            new: true,
          },
        );
        return res.status(200).json({
          success: true,
          message: "updated successfully",
          redirectUrl: "/admin/category",
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "User not founded",
      });
    }
  } catch (error) {}
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
