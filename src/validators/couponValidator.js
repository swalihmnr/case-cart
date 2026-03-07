import { body, validationResult } from "express-validator";

const validateResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }

  next();
};

export const addCouponValidator = [


  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3 }).withMessage("Title too short"),

  body("couponCode")
    .trim()
    .notEmpty().withMessage("Coupon code required")
    .isLength({ min: 4 }).withMessage("Coupon code too short"),


  body("description")
    .trim()
    .notEmpty().withMessage("Description required"),

  body("discountType")
  .isIn(["percentage", "fixedamount"])
  .withMessage("Invalid discount type"),

body("discountValue")
  .toFloat()
  .isFloat({ min: 1 })
  .withMessage("Discount must be greater than 0"),

body("minOrderValue")
  .toFloat()
  .isFloat({ min: 0 })
  .withMessage("Invalid minimum order value"),

body("maximumDiscount")
  .optional()
  .toFloat()
  .isFloat({ min: 0 })
  .withMessage("Invalid maximum discount"),

  body("startDate")
    .isISO8601()
    .withMessage("Invalid start date"),

  body("endDate")
    .isISO8601()
    .withMessage("Invalid end date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),


  body("status")
    .isIn(["active", "inactive","scheduled"])
    .withMessage("Invalid status"),

  validateResult
];