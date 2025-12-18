import express from 'express';
import userController from '../controllers/userController.js';
import {otpAccess} from '../middlewares/otp.js'
import{userAuth,keResetPass,goBackOtpVerify,blockUser,wishlistCount,cartCount} from '../middlewares/auth.js'
import upload from '../middlewares/multer.js';
const router=express.Router();
router.use(wishlistCount)
router.use(cartCount)
router.get('/login',goBackOtpVerify,userController.getLogin);
router.post('/login',userController.postLogin);
router.get('/signup',goBackOtpVerify,userController.getSignup);
router.post('/signup',userController.register)
router.get('/otpVerfication',otpAccess,userController.getOtpVerify);
router.post('/otpVerfication',userController.OtpVerify);
router.get('/resetPassword',keResetPass,userController.getResetPass);
router.post('/resetPassword',userController.postResetPass);
router.get('/landingPage',userController.getLandingPage)
router.get('/home',userAuth,blockUser,userController.getHome)
router.get('/forgotPassword',userController.getForgetPassword)
router.post('/forgotPassword',blockUser,userController.PostForgetPassword)    
router.post('/resendOtpVerification',userController.resendOtpVerify)
router.get('/logout',userController.logOut)
router.get('/product',userAuth,blockUser,userController.getProduct)
router.get('/product/:id/detials',userAuth,blockUser,userController.getDetialProduct);
router.post('/product/:id/getVariant',userController.getVariantData)
router.get('/user-profile',userAuth,blockUser,userController.getUserProfil);
router.post('/profile/info/edit',userAuth,userController.editProfileInfo);
router.patch('/profile/edit/img',upload.single('image'),userController.editProfileImg)
router.get('/wishlist',userAuth,blockUser,userController.getWishlist)
router.post('/product/wishlist/add',userAuth,userController.postWishlist);
router.delete('/product/wishlist/:id/rem',userController.remWishlist)
router.get('/cart',userController.getCart);
router.patch('/cart/add',userController.addCart)
router.post('/cart/quantity/:id',userController.cartQuantityUpdate);
router.patch('/product/cart/:id',userController.remCart)

export default router