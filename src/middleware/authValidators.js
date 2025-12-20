import { body, validationResult } from "express-validator";
import { generateCsrfToken } from "../config/csrf.js";

// Signup validation rules: name (2+ chars), email, password (8+ chars with uppercase and special char)
export const validateSignUpRules = [
  body("name")
    .trim()
    .escape()
    .isLength({ min: 2 })
    .withMessage("Name must be 2 characters atleast"),

  body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid email address"),

  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password length must be atleast 8")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[!@#$%^&*(),.?\":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  body("confirmPassword")
    .trim()
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

// Check signup validation errors and render with error messages
export function validationSignUpInput(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    const csrfToken = generateCsrfToken(req, res);
    return res.status(400).render("signup.ejs", {
      errorMessage: msg,
      old: { name: req.body.name, email: req.body.email },
      csrfToken,
    });
  }
  next();
}

// Check Login validation errors and render with error messages
export function loginValidation(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    const msg = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    const csrfToken = generateCsrfToken(req, res);
    return res.status(400).render("login.ejs", {
      errorMessage: msg,
      old: { email: req.body.email },
      csrfToken,
    });
  }
  next();
}
