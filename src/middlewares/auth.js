import { STATUS_CODES } from "../utils/statusCodes.js"
import user from "../models/userModel.js"
import wishlistModel from '../models/wishlistModel.js'
import cartModel from '../models/cartModel.js'
export const notUser=(req,res,next)=>{
  
  if(!req.session.user){
    return next()
  }
  return res.status(STATUS_CODES.UNAUTHORIZED).redirect('/login')
}
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
export const attachAdmin=(req,res,next)=>{
  res.locals.admin=req.session.admin|| null
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
export const keResetPass=(req,res,next)=>{
  if(req.session?.isKey===true){
    console.log('it is true')
    next()
  }else{
    res.redirect('/login')
  }

}
export const wishlistCount=async(req,res,next)=>{
  if(req.session.user?.id){
    res.locals.wishlistcount=await wishlistModel.countDocuments({userId:req.session.user.id});
  }else{
    res.locals.wishlistcount=0;
  }
  next();
}
export const cartCount=async(req,res,next)=>{
  if(req.session.user?.id){
    res.locals.cartCount=await cartModel.countDocuments({userId:req.session.user.id});

  }else{
    res.locals.cartCount=0;
  }
  next();
}
export const requiredAdmin =async(req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    return res.redirect('/admin/login')
  }
}