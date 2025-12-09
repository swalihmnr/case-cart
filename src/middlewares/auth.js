import { STATUS_CODES } from "../utils/statusCodes.js"
import user from "../models/userModel.js"
import mongoose from "mongoose"
export const userAuth=(req,res,next)=>{
  
  if(!req.session.user){
    return res.status(STATUS_CODES.UNAUTHORIZED).redirect('/login')
  }
  console.log(req.session.user,'user')
  next()
}
export const authOtp=(req,res,next)=>{
  if(req.session.requre_sign||!req.session.user){
    next()
  }else{
   return  res.redirect('/login')
  }
}
export const goBackOtpVerify=(req,res,next)=>{
  if(req.session.requre_sign){
   return res.redirect('/otpVerfication')
  }
  if(req.session.user){
    return res.redirect('/home')
  }
  next()
}

export const attachUser=(req,res,next)=>{
  res.locals.user=req.session.user|| null
  next()
}

export const blockUser = async(req, res, next) => {

  if (!req.session || !req.session.user) {
    return next();
  }
  const User=await user.findOne({email:req.session.user.email})

  if (User.isBlock) {
    delete req.session.user;
    return res.redirect("/login?blocked=true");
  }

  next();
};
