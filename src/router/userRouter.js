import express from 'express';
import userController from '../controllers/userController.js';
import {otpAccess} from '../middlewares/otp.js'
import{userAuth,authOtp,goBackOtpVerify,blockUser} from '../middlewares/auth.js'
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
export default router