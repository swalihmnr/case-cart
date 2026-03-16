import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // better for general API
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 7 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 7 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false
});
const otpLImiter=rateLimit({
    windowMs:5 * 60 * 1000,
    max:3,
    message:{
        success:false,
        message:"Too many login attempts. Please try again after 5 minutes."
    },
    standardHeaders:true,
    legacyHeaders:false
})

export default {
  apiLimiter,
  loginLimiter,
  otpLImiter
};