import Brand from "../../models/admin/brandModel.js";
import mongoose from "mongoose";
import { uploadBufferTocloudnery } from "../../utils/cloudneryUpload.js";


// List brands with pagination and search
const getBrand = async (req, res) => {
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

  const brands = await Brand.find(searchFilter)
    .skip(skip)
    .limit(limit)
    .lean();
  const totalItems = await Brand.find(searchFilter).countDocuments();
  const totalPages = Math.ceil(totalItems / limit);
  let currentPage = page;
  
  res.render("./admin/brand-list", {
    brands,
    totalItems,
    totalPages,
    skip,
    page,
    limit,
    currentPage,
    search,
  });
};

const getAddBrand = (req, res) => {
  res.render("./admin/add-brand");
};

// ==============================
// ADD BRAND (POST)
// ==============================
const postAddBrand = async (req, res) => {
  try {
    let { brandName, brandDescription, action } = req.body;

    if (!brandName || !brandDescription) {
      return res.status(400).json({
        success: false,
        message: "Brand name and description are required",
      });
    }

    const cleanName = brandName.trim();
    const cleanDescription = brandDescription.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Brand name cannot be empty",
      });
    }

    const nameRegex = /^[a-zA-Z0-9\s\-]{2,50}$/;

    if (!nameRegex.test(cleanName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand name format",
      });
    }

    if (cleanDescription.length < 5 || cleanDescription.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description must be between 5 and 500 characters",
      });
    }

    const existing = await Brand.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const newBrand = new Brand({
      name: cleanName,
      description: cleanDescription,
      isActive: true,
    });

    if (req.file) {
      const uploadResult = await uploadBufferTocloudnery(req.file.buffer);
      newBrand.icon = uploadResult.secure_url;
    }


    await newBrand.save();

    return res.status(200).json({
      success: true,
      message: "Brand saved successfully",
      redirectUrl:
        action === "save" ? "/admin/brands" : "/admin/brands/new",
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
// BLOCK / UNBLOCK BRAND
// ==============================
const blockBrand = async (req, res) => {
  try {
    let id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid brand.");
      return res.redirect("/admin/brands");
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const existing = await Brand.findOne({ _id: objectId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Not Founded",
      });
    } else {
      existing.isActive = !existing.isActive;
      await existing.save();
      
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
// GET EDIT BRAND PAGE
// ==============================
const editBrand = async (req, res) => {
  let id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Invalid brand.");
    return res.redirect("/admin/brands");
  }
  const objectId = new mongoose.Types.ObjectId(id);
  let brand = await Brand.findOne({ _id: objectId });
  if (!brand) {
    req.flash("error", "Brand not found");
    return res.redirect("/admin/brands");
  }
  res.render("admin/admin-edit-brand", { brand });
};

// ==============================
// UPDATE BRAND
// ==============================
const postEditBrand = async (req, res) => {
  try {
    const { brandName, brandDescription } = req.body;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID",
      });
    }

    const cleanName = brandName.trim();
    const cleanDescription = brandDescription.trim();

    if (cleanDescription.length < 5 || cleanDescription.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description must be between 5 and 500 characters",
      });
    }

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Brand name cannot be empty",
      });
    }

    const existing = await Brand.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // 🔹 Duplicate check
    const duplicate = await Brand.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Brand name already exists",
      });
    }

    // 🔹 Check if nothing changed (only if no new image)
    if (
      existing.name === cleanName &&
      existing.description === cleanDescription &&
      !req.file
    ) {
      return res.status(304).json({
        success: false,
        message: "No changes detected",
      });
    }

    let updateData = {
      name: cleanName,
      description: cleanDescription,
    };

    if (req.file) {
      const uploadResult = await uploadBufferTocloudnery(req.file.buffer);
      updateData.icon = uploadResult.secure_url;
    }

    await Brand.findByIdAndUpdate(id, updateData);


    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      redirectUrl: "/admin/brands",
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
  getBrand,
  getAddBrand,
  postAddBrand,
  blockBrand,
  editBrand,
  postEditBrand,
};
