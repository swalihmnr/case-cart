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
import checkoutController from "../../controllers/user/checkoutController.js";
router.use(wishlistCount);
router.use(cartCount);
router.get("/checkout", userAuth, blockUser, checkoutController.getCheckout);
export default router;
