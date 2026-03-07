import express from 'express'
const router =express.Router()
import { userAuth, keResetPass, goBackOtpVerify, blockUser, wishlistCount, cartCount, notUser } from '../../middlewares/auth.js'
router.use(wishlistCount)
router.use(cartCount)
import wishlistController from '../../controllers/user/wishlistController.js';
router.get('/wishlist', userAuth, blockUser, wishlistController.getWishlist)
router.post('/product/wishlist/add', userAuth, wishlistController.postWishlist);
router.delete('/product/wishlist/:id/rem', wishlistController.remWishlist)
export default router