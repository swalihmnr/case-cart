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
  getProductEdit,
  getAddproduct,
  postAddproduct,
  getProductEdit,
  blockProduct,
  productImageUpload,
  productImageEdit,
  imgSetMain,
  editImgDelete,
  editProductBasicInformation,
  passVariantData,
  postEditVariantSave,
  patchListUnlist,
};
