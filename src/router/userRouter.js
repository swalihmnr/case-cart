import express from 'express';
import userController from '../controllers/userController.js';
import {otpAccess} from '../middlewares/otp.js'
import{isLogged,isLogin} from '../middlewares/auth.js'
const router=express.Router();
router.get('/login',isLogged,userController.getLogin);
router.post('/login',isLogged,userController.postLogin);
router.get('/signup',isLogged,userController.getSignup);
router.post('/signup',isLogged,userController.register)
router.get('/otpVerfication',otpAccess,userController.getOtpVerify);
router.post('/otpVerfication',otpAccess,userController.OtpVerify);
router.get('/resetPassword',userController.getResetPass);
router.post('/resetPassword',userController.postResetPass);
router.get('/landingPage',userController.getLandingPage)
router.get('/home',isLogin,userController.getHome)
router.get('/forgotPassword',userController.getForgetPassword)
router.post('/forgotPassword',userController.PostForgetPassword)    
router.post('/resendOtpVerification',userController.resendOtpVerify)
router.get('/logout',userController.logOut)
export default router