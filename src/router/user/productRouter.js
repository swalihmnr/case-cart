import express from "express";
const router = express.Router();
import {
  userAuth,
  keResetPass,
  goBackOtpVerify,
  blockUser,
  wishlistCount,
  cartCount,
  notUser,
} from "../../middlewares/auth.js";
router.use(wishlistCount);
router.use(cartCount);
import productController from "../../controllers/user/productController.js";
router.get("/product", productController.getProduct);
router.get(
  "/product/:id/detials",
  blockUser,
  productController.getDetialProduct,
);
router.post("/product/:id/getVariant", productController.getVariantData);
export default router;
