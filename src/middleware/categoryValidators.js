import { body, validationResult } from "express-validator";
import { generateCsrfToken } from "../config/csrf.js";

// Category validation rules
export const categoryRules = [
  body("name")
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("description")
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters")
    .optional({ nullable: true, checkFalsy: true }),
];

// Validate add category
export function validateAddCategory(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const msg = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    const csrfToken = generateCsrfToken(req, res);

    return res.status(400).render("addcategory.ejs", {
      errorMessage: msg,
      old: {
        name: req.body.name,
        description: req.body.description,
      },
      csrfToken,
    });
  }
  next();
}

// Validate edit category
export function validateEditCategory(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const msg = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    const csrfToken = generateCsrfToken(req, res);
    const { id } = req.params;

    return res.status(400).render("editcategory.ejs", {
      errorMessage: msg,
      category: {
        id,
        name: req.body.name,
        description: req.body.description,
      },
      csrfToken,
    });
  }
  next();
}
