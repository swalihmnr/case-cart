import productModel from "../../models/admin/productModel.js";
import categoryModel from "../../models/admin/categoryModel.js";
import Brand from "../../models/admin/brandModel.js";
import wishlistModel from "../../models/wishlistModel.js";
import HomepageSettings from "../../models/admin/homepageSettingsModel.js";

// ==============================
// GET HOME PAGE
// ==============================
// Renders user home page
let getHome = async (req, res) => {
  try {
    // Fetch top 8 unblocked products & active categories
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

      // JOIN BRANDS so minVariant.brandId has brand details
      {
        $lookup: {
          from: "brands",
          localField: "variants.brandId",
          foreignField: "_id",
          as: "_brandsLookup",
        },
      },
      {
        $addFields: {
          variants: {
            $map: {
              input: "$variants",
              as: "v",
              in: {
                $mergeObjects: [
                  "$$v",
                  {
                    brandId: {
                      $let: {
                        vars: {
                          matchedBrand: {
                            $first: {
                              $filter: {
                                input: "$_brandsLookup",
                                as: "b",
                                cond: { $eq: ["$$b._id", "$$v.brandId"] },
                              },
                            },
                          },
                        },
                        in: { $ifNull: ["$$matchedBrand", "$$v.brandId"] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },

      {
        $addFields: {
          minPrice: { $min: "$variants.salePrice" },
          minVariant: { $first: "$variants" }, // Just need one variant for the ID
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 8 },
    ];

    const [products, categories, brands, siteSettings] = await Promise.all([
      productModel.aggregate(pipeline),
      categoryModel.find({ isActive: true }).lean(),
      Brand.find({ isActive: true }).lean(),
      HomepageSettings.findOne({ key: "main" }).lean(),
    ]);

    let wishlistItems = [];
    let user = null;
    if (req.session.user?.id) {
      user = req.session.user;
      wishlistItems = await wishlistModel.find({ userId: req.session.user.id });
    }

    res.render("./user/home", {
      products,
      categories,
      brands,
      wishlistItems,
      user,
      siteSettings,
    });
  } catch (err) {
    console.error("Error in getHome:", err);
    res.status(500).send("Internal Server Error");
  }
};

export default {
  getHome,
};
