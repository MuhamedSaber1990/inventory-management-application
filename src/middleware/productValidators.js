import { body, validationResult } from "express-validator";
import { generateCsrfToken } from "../config/csrf.js";
import { getCategories } from "../models/productModel.js";

// Product validation rules
export const productRules = [
  body("name")
    .trim()
    .escape()
    .isLength({ min: 1, max: 250 })
    .withMessage("Product name must be between 1 and 250 characters"),

  body("price")
    .trim()
    .toFloat()
    .isFloat({ min: 1, max: 1000000 })
    .withMessage("Price must be a number between 1 and 1,000,000"),

  body("quantity")
    .trim()
    .toInt()
    .isInt({ min: 0, max: 10000 })
    .withMessage("Quantity must be between 0 and 10,000"),

  body("description")
    .trim()
    .escape()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Description must be 1-5000 characters long"),

  body("category_id")
    .optional({ nullable: true, checkFalsy: true })
    .isInt()
    .withMessage("Invalid category selected"),
];

// Check product creation validation errors
export async function validateAddProducts(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const msg = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    const csrfToken = generateCsrfToken(req, res);
    const categories = await getCategories();

    return res.status(400).render("addproduct.ejs", {
      errorMessage: msg,
      old: {
        name: req.body.name,
        price: req.body.price,
        quantity: req.body.quantity,
        description: req.body.description,
        category_id: req.body.category_id,
      },
      categories,
      csrfToken,
    });
  }
  next();
}

// Check product update validation errors
export async function validateUpdateProducts(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const msg = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    const product = {
      id: req.params.id,
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
      description: req.body.description,
      category_id: req.body.category_id,
    };
    const csrfToken = generateCsrfToken(req, res);
    const categories = await getCategories();

    return res.status(400).render("editproduct.ejs", {
      errorMessage: msg,
      product,
      categories,
      csrfToken,
    });
  }
  next();
}
