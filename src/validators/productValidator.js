import { body, validationResult } from "express-validator";
const validateResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // first error only
    });
  }

  next();
};
export const addProductValidation = [
  body("productName")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3 })
    .withMessage("Product name must be at least 3 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description too short"),

  // CATEGORY ID
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID"),

  body("status")
    .notEmpty()
    .withMessage("Status required")
    .isIn(["active", "inactive"])
    .withMessage("Invalid status"),

  // MAIN IMAGE INDEX
  body("mainImageIndex")
    .notEmpty()
    .withMessage("Main image index required")
    .isInt({ min: 0 })
    .withMessage("Invalid main image index"),

  body("devices")
    .notEmpty()
    .withMessage("Variants required")
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Devices must be an array");
        }

        parsed.forEach((v) => {
          if (!v.name || !v.originalPrice || !v.salePrice || !v.stock) {
            throw new Error("Invalid variant data");
          }
        });

        return true;
      } catch (err) {
        throw new Error("Invalid devices format");
      }
    }),
  validateResult,
];
