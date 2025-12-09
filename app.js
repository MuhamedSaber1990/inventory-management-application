// Main Express server configuration with CSRF protection and middleware setup
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { doubleCsrfProtection } from "./src/config/csrf.js";
import { requireAuth } from "./src/middleware/auth.js";
import {
  notFoundHandler,
  globalErrorHandler,
} from "./src/middleware/errorHandler.js";
import {
  validationSignUpInput,
  validateAddProducts,
  validateUpdateProducts,
  validateSignUpRules,
  productRules,
} from "./src/middleware/validation.js";
import { loginLimiter, signUpLimiter } from "./src/middleware/rateLimiters.js";
import {
  loginPage,
  handleLogin,
  handleSignUp,
  showSignUp,
  dashboard,
  logout,
} from "./src/controllers/authController.js";
import {
  showProducts,
  showAddProductForm,
  addProductHandler,
  updateProductsFrom,
  updateProductHandeler,
  deleteProductHandler,
} from "./src/controllers/product.controller.js";

// Initialize environment variables and Express application
dotenv.config();
const app = express();
const port = process.env.PORT;

// Configure middleware for parsing requests, static files, and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Authentication routes (login, signup with CSRF and rate limiting)
app.get("/", loginPage);
app.post("/login", doubleCsrfProtection, loginLimiter, handleLogin);
app.get("/signup", showSignUp);
app.post(
  "/signup",
  doubleCsrfProtection,
  signUpLimiter,
  validateSignUpRules,
  validationSignUpInput,
  handleSignUp
);
app.get("/dashboard", requireAuth, dashboard);
app.post("/logout", doubleCsrfProtection, logout);
// Product management routes (view, add, edit, delete with authentication)
app.get("/products", requireAuth, showProducts);
app.get("/products/add", requireAuth, showAddProductForm);
app.post(
  "/products/new",
  requireAuth,
  doubleCsrfProtection,
  productRules,
  validateAddProducts,
  addProductHandler
);

app.get("/products/edit/:id", requireAuth, updateProductsFrom);

app.post(
  "/products/edit/:id",
  requireAuth,
  doubleCsrfProtection,
  productRules,
  validateUpdateProducts,
  updateProductHandeler
);
app.post(
  "/products/delete/:id",
  requireAuth,
  doubleCsrfProtection,
  deleteProductHandler
);

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
