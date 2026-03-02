import express from 'express';
import userController from '../controllers/userController.js';
import { otpAccess } from '../middlewares/otp.js'
import { userAuth, keResetPass, goBackOtpVerify, blockUser, wishlistCount, cartCount, notUser } from '../middlewares/auth.js'
import upload from '../middlewares/multer.js';
const router = express.Router();
router.use(wishlistCount)
router.use(cartCount)
router.get('/login', goBackOtpVerify, userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/signup', goBackOtpVerify, userController.getSignup);
router.post('/signup', userController.register)
router.get('/otpVerfication', otpAccess, userController.getOtpVerify);
router.post('/otpVerfication', userController.OtpVerify);
router.get('/resetPassword', keResetPass, userController.getResetPass);
router.post('/resetPassword', userController.postResetPass);
router.get('/home', userController.getHome)
router.get('/forgotPassword', notUser, userController.getForgetPassword)
router.post('/forgotPassword', blockUser, userController.PostForgetPassword)
router.post('/resendOtpVerification', userController.resendOtpVerify)
router.get('/logout', userController.logOut)
router.get('/product', userController.getProduct)
router.get('/product/:id/detials', userAuth, blockUser, userController.getDetialProduct);
router.post('/product/:id/getVariant', userController.getVariantData)
router.get('/user-profile', userAuth, blockUser, userController.getUserProfil);
router.post('/profile/info/edit', userAuth, userController.editProfileInfo);
router.patch('/profile/edit/img', upload.single('image'), userController.editProfileImg)
router.get('/security', userAuth, blockUser, userController.getSecurity);
router.post('/password/reset', userAuth, userController.resetPass)
router.get('/wishlist', userAuth, blockUser, userController.getWishlist)
router.post('/product/wishlist/add', userAuth, userController.postWishlist);
router.delete('/product/wishlist/:id/rem', userController.remWishlist)
router.get('/cart', userAuth, blockUser, userController.getCart);
router.patch('/cart/add', userController.addCart)
router.post('/cart/quantity/:id', userController.cartQuantityUpdate);
router.patch('/product/cart/:id', userController.remCart)
router.get('/checkout', userAuth, blockUser, userController.getCheckout);
router.get('/address', userAuth, userController.getAddressMngmnt);
router.get('/address/edit/:id', userAuth, userController.geteditAddress);
router.get('/address/add', userAuth, userController.getAddAddress);
router.post('/address/add', userController.addAddress);
router.post('/address/edit', userController.editAddress);
router.patch('/address/:id/del', userController.deleteAddress)
router.get('/order/confirm/:id', userController.getConfirmation);
router.post('/order/confirm', userController.ordConfirmation)
router.get('/order', userAuth, blockUser, userController.getOrder);
router.get('/order/:id', userAuth, blockUser, userController.getOrderDetails);
router.post('/order/:id/payment-failed', userAuth, blockUser, userController.markPaymentFailed);
router.patch('/order/:id/cancel-all', userAuth, blockUser, userController.cancelWholeOrder);
router.patch('/order/:id/cancel', userController.orderCancel)
router.patch('/order/:id/return', userController.returnReq)
router.get('/order/:id/invoice', userAuth, blockUser, userController.invoice)
export default router