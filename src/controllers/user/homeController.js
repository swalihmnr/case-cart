import productModel from "../../models/admin/productModel.js";
import wishlistModel from "../../models/wishlistModel.js";

// ==============================
// GET HOME PAGE
// ==============================
// Renders user home page
let getHome = async (req, res) => {
  try {
    // Fetch top 4 unblocked products
    const pipeline = [
      { $match: { isBlock: false } },
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

      // JOIN CATEGORY to ensure it's active
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

      {
        $addFields: {
          minVariant: { $first: "$variants" }, // Just need one variant for the ID
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 8 },
    ];

    const products = await productModel.aggregate(pipeline);

    let wishlistItems = [];
    let user = false;
    if (req.session.user?.id) {
      user = true;
      wishlistItems = await wishlistModel.find({ userId: req.session.user.id });
    }

    res.render("./user/home", {
      products,
      wishlistItems,
      user,
    });
  } catch (err) {
    console.error("Error in getHome:", err);
    res.status(500).send("Internal Server Error");
  }
};

export default {
  getHome,
};
