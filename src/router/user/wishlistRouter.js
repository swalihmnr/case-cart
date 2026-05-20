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
import wishlistController from "../../controllers/user/wishlistController.js";
router.get("/wishlist", userAuth, blockUser, wishlistController.getWishlist);
router.post("/wishlist", userAuth, wishlistController.postWishlist);
router.patch("/wishlist/toggle", userAuth, wishlistController.toggleWishlist);
router.delete("/wishlist/:id", wishlistController.remWishlist);
export default router;
