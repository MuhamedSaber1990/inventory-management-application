import { validationResult } from "express-validator";
import { generateCsrfToken } from "../config/csrf.js";

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
export function validateAddProducts(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    const csrfToken = generateCsrfToken(req, res);
    return res.status(400).render("addproduct.ejs", {
      errorMessage: msg,
      old: {
        name: req.body.name,
        price: req.body.price,
        quantity: req.body.quantity,
        description: req.body.description,
      },
      csrfToken,
    });
  }
  next();
}

export function validateUpdateProducts(req, res, next) {
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
    };
    const csrfToken = generateCsrfToken(req, res);
    return res
      .status(400)
      .render("editproduct.ejs", { errorMessage: msg, product, csrfToken });
  }
  next();
}
