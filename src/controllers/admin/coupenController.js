import { STATUS_CODES } from "../../utils/statusCodes.js";
import coupenModel from "../../models/admin/coupenModel.js";
import mongoose from "mongoose";

const renderCoupenPage = async (req, res) => {
  const { page = 1, search } = req.query;

  const limit = 8;

  const currentPage = Math.max(parseInt(page) || 1, 1);

  const skip = (page - 1) * limit;
  let filter = {};
  if (search) {
    filter = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { couponCode: { $regex: search, $options: "i" } },
      ],
    };
  }
  let totalCoupon = await coupenModel.countDocuments();
  const totalPages = Math.ceil(totalCoupon / limit);
  const coupens = await coupenModel
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
  const today = new Date();

  await coupenModel.updateMany(
    {
      endDate: { $lt: today },
      status: { $ne: "expired" },
    },
    { $set: { status: "expired" } },
  );

  await coupenModel.updateMany(
    {
      startDate: { $lte: today },
      status: { $nin: ["inactive", "expired"] },
    },
    { $set: { status: "active" } },
  );

  const result = await coupenModel.aggregate([
    {
      $facet: {
        activeCount: [{ $match: { status: "active" } }, { $count: "count" }],
        totalUsage: [
          {
            $group: {
              _id: null,
              value: { $sum: "$usedCount" },
            },
          },
        ],
        used: [{ $match: { usedCount: { $gt: 0 } } }, { $count: "count" }],
        unused: [{ $match: { usedCount: 0 } }, { $count: "count" }],
      },
    },
  ]);
  console.log(result[0]);
  const data = result[0];

  const activeCount = data.activeCount[0]?.count || 0;
  const totalUsage = data.totalUsage[0]?.value || 0;
  const used = data.used[0]?.count || 0;
  const unused = data.unused[0]?.count || 0;

  res.render("./admin/coupen-dashboard", {
    coupens,
    activeCount,
    totalUsage,
    used,
    unused,
    totalPages,
    currentPage,
    page,
    search,
  });
};
const renderAddCoupen = async (req, res) => {
  res.render("./admin/coupen-add");
};
const postAddCoupen = async (req, res) => {
  console.log("entered");
  try {
    const {
      title,
      couponCode,
      description,
      discountType,
      discountValue,
      maximumDiscount,
      minOrderValue,
      startDate,
      endDate,
      status,
    } = req.body;

    if (
      !title ||
      !couponCode ||
      !description ||
      !discountType ||
      discountValue === undefined ||
      minOrderValue === undefined ||
      !startDate ||
      !endDate ||
      !status
    ) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "some fields are missing!",
      });
    } else {
      const existing = await coupenModel.findOne({
        $or: [
          { title: { $regex: new RegExp(`^${title.trim()}$`, "i") } },
          { couponCode: { $regex: new RegExp(`^${couponCode.trim()}$`, "i") } },
        ],
      });

      if (existing) {
        if (title.trim().toLowerCase() === existing.title.toLowerCase()) {
          return res.status(STATUS_CODES.CONFLICT).json({
            success: false,
            message: "Coupon title already exists",
          });
        }
        if (couponCode.trim().toUpperCase() === existing.couponCode) {
          return res.status(STATUS_CODES.CONFLICT).json({
            success: false,
            message: "Coupon code already exists",
          });
        }
      }
      let use = await coupenModel.create({
        title: title.trim(),
        couponCode: couponCode.toUpperCase().trim(),
        description,
        discountType,
        discountValue,
        maximumDiscount: maximumDiscount || 0,
        MinimumPurchaseValue: minOrderValue,
        startDate,
        endDate,
        status,
      });
      console.log(use);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Coupen created Successfully!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error",
    });
  }
};

const renderEditCoupon = async (req, res) => {
  const { id } = req.params;

  // Validate ID first
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Invalid coupon ID");
    return res.redirect("/admin/coupen");
  }

  const coupon = await coupenModel.findById(id);

  if (!coupon) {
    req.flash("error", "Coupon not found");
    return res.redirect("/admin/coupen");
  }

  res.render("./admin/coupen-edit", {
    coupon,
  });
};


const postEditCoupop = async (req, res) => {
  console.log(req.body);
  try {
    const {
      couponId,
      title,
      couponCode,
      description,
      discountType,
      discountValue,
      maximumDiscount,
      minOrderValue,
      startDate,
      endDate,
      status,
    } = req.body;
    console.log(couponId, "it is coupon id");
    if (
      !title ||
      !couponCode ||
      !description ||
      !discountType ||
      discountValue === undefined ||
      minOrderValue === undefined ||
      !startDate ||
      !endDate ||
      status === undefined
    ) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "some fields are missing!",
      });
    } else {
      const existing = await coupenModel.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(couponId) },
        $or: [
          { title: { $regex: new RegExp(`^${title.trim()}$`, "i") } },
          { couponCode: { $regex: new RegExp(`^${couponCode.trim()}$`, "i") } }
        ]
      });

      if (existing) {
        if (title.trim().toLowerCase() === existing.title.toLowerCase()) {
          return res.status(STATUS_CODES.CONFLICT).json({
            success: false,
            message: "Another coupon with this title already exists"
          });
        }
        return res.status(STATUS_CODES.CONFLICT).json({
          success: false,
          message: "Another coupon with this code already exists"
        });
      }
      const coupon = await coupenModel.findById(
        new mongoose.Types.ObjectId(couponId),
      );
      let flag = false;
      if (title !== coupon.title) {
        coupon.title = title;
        flag = true;
      }
      if (couponCode !== coupon.couponCode) {
        coupon.couponCode = couponCode;
        flag = true;
      }
      if (description !== coupon.description) {
        coupon.description = description;
        flag = true;
      }
      if (discountType !== coupon.discountType) {
        coupon.discountType = discountType;
        flag = true;
      }
      if (discountValue !== coupon.discountValue) {
        coupon.discountValue = discountValue;
        flag = true;
      }
      if (
        maximumDiscount !== undefined &&
        maximumDiscount !== coupon.maximumDiscount
      ) {
        coupon.maximumDiscount = maximumDiscount;
        flag = true;
      }
      if (minOrderValue !== coupon.MinimumPurchaseValue) {
        coupon.MinimumPurchaseValue = minOrderValue;
        flag = true;
      }

      if (
        new Date(startDate).toISOString().split("T")[0] !==
        new Date(coupon.startDate).toISOString().split("T")[0]
      ) {
        coupon.startDate = startDate;
        flag = true;
      }
      if (
        new Date(endDate).toISOString().split("T")[0] !==
        new Date(coupon.endDate).toISOString().split("T")[0]
      ) {
        coupon.endDate = endDate;
        flag = true;
      }
      if (status !== undefined && status.trim() !== coupon.status) {
        coupon.status = status.trim();
        flag = true;
      }
      if (flag) {
        await coupon.save();
        console.log("FRONTEND STATUS:", status);
        console.log("DB STATUS:", coupon.status);
        console.log(`it is the coupon status:${coupon.status}`);
        return res.status(STATUS_CODES.OK).json({
          success: true,
          message: "updated successfully",
        });
      }

      return res.status(STATUS_CODES.OK).json({
        success: false,
        message: "Nothing updeted yet",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Errror",
    });
  }
};
const deletCoupon = async (req, res) => {
  try {
    console.log("hol");
    const objectId = new mongoose.Types.ObjectId(req.params.id);
    await coupenModel.findByIdAndDelete(objectId);
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Coupon Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal sever error",
    });
  }
};
export default {
  renderCoupenPage,
  renderAddCoupen,
  postAddCoupen,
  renderEditCoupon,
  postEditCoupop,
  deletCoupon,
};
