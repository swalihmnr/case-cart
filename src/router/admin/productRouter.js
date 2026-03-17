import express from "express";
const router = express.Router();
import upload from "../../middlewares/multer.js";
import { addProductValidation } from "../../validators/productValidator.js";
import productController from "../../controllers/admin/productController.js";
import { requiredAdmin } from "../../middlewares/auth.js";
router.use(requiredAdmin);
router.get("/add-product", productController.getAddproduct);
router.post(
  "/add-product",
  upload.array("images", 5),
  addProductValidation,
  productController.postAddproduct,
);
router.get("/product-list", productController.getProductList);
router.get("/product/edit/:id", productController.getProductEdit);
router.patch(
  "/product/:id/edit-image",
  upload.single("image"),
  productController.productImageEdit,
);
router.patch("/product/list/block/:id", productController.blockProduct);
router.patch("/product/edit/:id/img-set-main", productController.imgSetMain);
router.patch(
  "/product/edit/:id/img-upload",
  upload.single("image"),
  productController.productImageUpload,
);
router.patch("/product/edit/:id/img-delete", productController.editImgDelete);
router.patch(
  "/product/edit/:id/basic-info",
  productController.editProductBasicInformation,
);
router.patch(
  "/product/edit/:id/variant-data",
  productController.passVariantData,
);
router.post(
  "/product/edit/:id/variant-save",
  productController.postEditVariantSave,
);
router.post(
  "/product/edit/:id/add-variant",
  productController.postAddVariant,
);
router.patch(
  "/product/edit/:id/veriant-toggle",
  productController.patchListUnlist,
);
export default router;
