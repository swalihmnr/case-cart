import { body, validationResult } from "express-validator";
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array()[0].msg;
    return res.json({
      success: false,
      message: errorMsg,
    });
  }
  next();
};
export const loginValidator = [
  body("Email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email format"),
  body("Password").notEmpty().withMessage("password is required"),
];
