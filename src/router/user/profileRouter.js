import express from "express";
const router = express.Router();
import upload from "../../middlewares/multer.js";
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
import profileContorller from "../../controllers/user/profileContorller.js";
import { profileValidator } from "../../validators/profileValidator.js";

router.get(
  "/user-profile",
  userAuth,
  blockUser,
  profileContorller.getUserProfil,
);
router.post(
  "/profile/info/edit",
  userAuth,
  profileValidator,
  profileContorller.editProfileInfo,
);
router.patch(
  "/profile/edit/img",
  upload.single("image"),
  profileContorller.editProfileImg,
);
export default router;
