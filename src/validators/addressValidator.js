import { body, validationResult } from "express-validator";

const validateResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMsg = errors.array()[0].msg;
    return res.status(400).json({
      success: false,
      message: errorMsg,
    });
  }

  next();
};

export const addressValidator = [
  body("data.firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),

  body("data.lastName").trim().notEmpty().withMessage("Last name is required"),

  body("data.phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("en-IN")
    .withMessage("Invalid mobile number"),

  body("data.streetAddress")
    .trim()
    .notEmpty()
    .withMessage("Street address is required")
    .isLength({ min: 5 })
    .withMessage("Street address too short"),

  body("data.landmark").optional().trim(),

  body("data.city").trim().notEmpty().withMessage("City is required"),

  body("data.state").trim().notEmpty().withMessage("State is required"),

  body("data.pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .isPostalCode("IN")
    .withMessage("Invalid pincode"),

  body("data.addressType")
    .notEmpty()
    .withMessage("Address type is required")
    .isIn(["Home", "Work", "Other"])
    .withMessage("Invalid address type"),

  body("data.isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be true or false"),

  validateResult,
];
