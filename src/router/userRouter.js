import express from 'express';
import userController from '../controllers/userController.js';
import {otpAccess} from '../middlewares/otp.js'
import{userAuth,authOtp,goBackOtpVerify,blockUser} from '../middlewares/auth.js'
import upload from '../middlewares/multer.js';
import adminController from '../controllers/adminController.js';
const router=express.Router();
router.get('/login',goBackOtpVerify,userController.getLogin);
router.post('/login',userController.postLogin);
router.get('/signup',goBackOtpVerify,userController.getSignup);
router.post('/signup',userController.register)
router.get('/otpVerfication',otpAccess,userController.getOtpVerify);
router.post('/otpVerfication',userController.OtpVerify);
router.get('/resetPassword',userAuth,userController.getResetPass);
router.post('/resetPassword',userController.postResetPass);
router.get('/landingPage',userController.getLandingPage)
router.get('/home',userAuth,blockUser,userController.getHome)
router.get('/forgotPassword',userAuth,userController.getForgetPassword)
router.post('/forgotPassword',userController.PostForgetPassword)    
router.post('/resendOtpVerification',userController.resendOtpVerify)
router.get('/logout',userController.logOut)
router.get('/product',userAuth,blockUser,userController.getProduct)
router.get('/product/:id/detials',userAuth,blockUser,userController.getDetialProduct);
router.get('/user-profile',userAuth,blockUser,userController.getUserProfil);
router.post('/profile/info/edit',userAuth,userController.editProfileInfo);
router.patch('/profile/edit/img',upload.single('image'),userController.editProfileImg)
router.get('/wishlist',userController.getWishlist)

export default router