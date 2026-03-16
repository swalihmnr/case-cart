import { body, validationResult } from "express-validator";

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

export const addressValidator = [
  // First Name
  body("data.firstName")
    .trim()
    .notEmpty().withMessage("First name is required")
    .isLength({ min: 2, max: 30 }).withMessage("First name must be 2–30 characters")
    .matches(/^[A-Za-z\s]+$/).withMessage("First name must contain only letters"),

  // Last Name
  body("data.lastName")
    .trim()
    .notEmpty().withMessage("Last name is required")
    .isLength({ min: 1, max: 30 }).withMessage("Last name must be 1–30 characters")
    .matches(/^[A-Za-z\s]+$/).withMessage("Last name must contain only letters"),

  // Phone (Indian mobile: starts 6-9, 10 digits)
  body("data.phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit Indian mobile number"),

  // Street Address
  body("data.streetAddress")
    .trim()
    .notEmpty().withMessage("Street address is required")
    .isLength({ min: 5, max: 100 }).withMessage("Street address must be 5–100 characters"),

  // Landmark (optional)
  body("data.landmark").optional({ checkFalsy: true }).trim()
    .isLength({ max: 60 }).withMessage("Landmark too long (max 60 chars)"),

  // City — only letters/spaces
  body("data.city")
    .trim()
    .notEmpty().withMessage("City is required")
    .matches(/^[A-Za-z\s]+$/).withMessage("City must contain only letters")
    .isLength({ min: 2, max: 50 }).withMessage("City must be 2–50 characters"),

  // State — must be one of the allowed Indian states
  body("data.state")
    .trim()
    .notEmpty().withMessage("State is required")
    .isIn([
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
      "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
      "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
      "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
    ])
    .withMessage("Select a valid Indian state"),

  // PIN Code — exactly 6 digits, valid Indian postal code
  body("data.pincode")
    .trim()
    .notEmpty().withMessage("PIN code is required")
    .matches(/^\d{6}$/).withMessage("PIN code must be exactly 6 digits")
    .isPostalCode("IN").withMessage("Enter a valid Indian PIN code"),

  // Address Type
  body("data.addressType")
    .notEmpty().withMessage("Address type is required")
    .isIn(["Home", "Work", "Other"]).withMessage("Address type must be Home, Work, or Other"),

  // isDefault (optional boolean)
  body("data.isDefault")
    .optional()
    .isBoolean().withMessage("isDefault must be true or false"),

  validateResult,
];
