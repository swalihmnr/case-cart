import express from 'express';
let router =express.Router();
import couponController from '../../controllers/user/couponController.js';
import { userAuth, keResetPass, goBackOtpVerify, blockUser, wishlistCount, cartCount, notUser } from '../../middlewares/auth.js'
router.use(wishlistCount)
router.use(cartCount)
router.post('/checkout/verify/coupon',couponController.verifyCoupon)

export default router