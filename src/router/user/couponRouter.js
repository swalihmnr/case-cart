import express from 'express';
import couponController from '../../controllers/user/couponController.js';

let router =express.Router();
router.post('/checkout/verify/coupon',couponController.verifyCoupon)

export default router