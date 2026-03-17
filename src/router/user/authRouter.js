import express from "express";
const router = express.Router();
import authController from "../../controllers/user/authController.js";
import { loginValidator } from "../../validators/loginValidator.js";
import { registerValidator } from "../../validators/registerValidator.js";
import {
  resetPasswordValidator,
  passwordChangeValidator,
} from "../../validators/passwordValidator.js";
import { otpAccess } from "../../middlewares/otp.js";
import {
  userAuth,
  keResetPass,
  goBackOtpVerify,
  blockUser,
  wishlistCount,
  cartCount,
  notUser,
} from "../../middlewares/auth.js";
import rateLimiter from "../../middlewares/rateLimiter.js";
router.use(wishlistCount);
router.use(cartCount);
router.get("/login", goBackOtpVerify, authController.getLogin);
router.post(
  "/login",
  loginValidator,
  rateLimiter.loginLimiter,
  authController.postLogin,
);
router.get("/signup", goBackOtpVerify, authController.getSignup);
router.post("/signup", registerValidator, authController.register);
router.get("/otpVerfication", otpAccess, authController.getOtpVerify);
router.post("/otpVerfication", authController.OtpVerify);
router.get("/resetPassword", keResetPass, authController.getResetPass);
router.post(
  "/resetPassword",
  resetPasswordValidator,
  authController.postResetPass,
);
router.get("/forgotPassword", notUser, authController.getForgetPassword);
router.post("/forgotPassword", blockUser, authController.PostForgetPassword);
router.post("/resendOtpVerification", authController.resendOtpVerify);
router.get("/logout", authController.logOut);
router.get("/security", userAuth, blockUser, authController.getSecurity);
router.post(
  "/password/reset",
  userAuth,
  passwordChangeValidator,
  authController.resetPass,
);
export default router;
