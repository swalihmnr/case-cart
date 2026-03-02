import {body,validationResult } from "express-validator";
const validateResult=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const errorMsg=errors.array()[0].msg;
        return res.json({success:false,message:errorMsg})
    }
    next()
}
export const registerValidator = [
    body("firstname")
    .trim()
    .notEmpty().withMessage('First name is required!')
    .isLength({min:3}).withMessage("First name must be at least 3 characters"),
    body("lastname")
    .trim()
    .notEmpty().withMessage('Last name is required'),
    body("number")
    .notEmpty().withMessage("Phone number is required ")
    .isMobilePhone('en-IN').withMessage("Invalid mobile number"),
    body('email')
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage('Invalid Email format'),
    body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({min:8}).withMessage('password must be at least 8 characters'),
    body('refferalCode')
    .optional(),
    validateResult
    
]
    