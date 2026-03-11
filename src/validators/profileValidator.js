import { body, validationResult } from "express-validator";

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = errors.array()[0].msg;
        return res.json({ success: false, message: errorMsg });
    }
    next();
};

export const profileValidator = [
    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required!")
        .isLength({ min: 2 })
        .withMessage("First name must be at least 2 characters")
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("First name should only contain alphabets"),
    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .isLength({ min: 1 }) // Last name can be short, but usually min 1
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Last name should only contain alphabets"),
    body("number")
        .notEmpty()
        .withMessage("Phone number is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid mobile number (must be 10 digits)"),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid Email format"),
    validateResult,
];
