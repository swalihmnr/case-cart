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
import homeController from "../../controllers/user/homeController.js";
router.get("/", homeController.getHome);
export default router;
