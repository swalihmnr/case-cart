import { body, validationResult } from "express-validator";
import mongoose from "mongoose";

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

export const addOfferValidator = [


  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3 }).withMessage("Title must be at least 3 characters"),

  body("offerType")
    .isIn(["percentage", "flat"])
    .withMessage("Invalid offer type"),


  body("offerValue")
    .toFloat()
    .isFloat({ min: 1 })
    .withMessage("Offer value must be greater than 0")
    .custom((value, { req }) => {
      if (req.body.offerType === "percentage" && value > 90) {
        throw new Error("Percentage cannot exceed 90%");
      }
      return true;
    }),

  body("applicableOn")
    .isIn(["product", "category"])
    .withMessage("Invalid applicable type"),


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

  body("categoryIds")
    .optional()
    .custom((value, { req }) => {
      if (req.body.applicableOn === "category") {

        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error("Select at least one category");
        }

        value.forEach(id => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid category ID");
          }
        });
      }
      return true;
    }),

  body("productIds")
    .optional()
    .custom((value, { req }) => {
      if (req.body.applicableOn === "product") {

        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error("Select at least one product");
        }

        value.forEach(id => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid product ID");
          }
        });
      }
      return true;
    }),

  validateResult
];