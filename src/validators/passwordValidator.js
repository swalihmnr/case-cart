import { body, validationResult } from "express-validator";

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array()[0].msg;
    return res.json({ success: false, message: errorMsg });
  }
  next();
};

export const resetPasswordValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be 8+ characters with at least one uppercase, one lowercase, one number, and one special character",
    ),
  validateResult,
];

export const passwordChangeValidator = [
  body("newPassword")
    .notEmpty()
    .withMessage("New Password is required")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "New Password must be 8+ characters with at least one uppercase, one lowercase, one number, and one special character",
    ),
  validateResult,
];
