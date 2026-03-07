import express from 'express'
const router =express.Router()
import { userAuth, keResetPass, goBackOtpVerify, blockUser, wishlistCount, cartCount, notUser } from '../../middlewares/auth.js'
router.use(wishlistCount)
router.use(cartCount)
import cartController from '../../controllers/user/cartController.js';
router.get('/cart', userAuth, blockUser, cartController.getCart);
router.patch('/cart/add', cartController.addCart)
router.post('/cart/quantity/:id',cartController.cartQuantityUpdate);
router.patch('/product/cart/:id', cartController.remCart)
export default router