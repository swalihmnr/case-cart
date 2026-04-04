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
import { addressValidator } from "../../validators/addressValidator.js";
router.use(wishlistCount);
router.use(cartCount);
import addressController from "../../controllers/user/addressController.js";
router.get("/address", userAuth, addressController.getAddressMngmnt);
router.get("/address/edit/:id", userAuth, addressController.geteditAddress);
router.get("/address/add", userAuth, addressController.getAddAddress);
router.post("/address/add", addressValidator, addressController.addAddress);
router.put("/address/edit", addressValidator, addressController.editAddress);
router.patch("/address/:id/del", addressController.deleteAddress);
export default router;
