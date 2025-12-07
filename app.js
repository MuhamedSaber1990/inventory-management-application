import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { doubleCsrfProtection } from "./src/config/csrf.js";
import { requireAuth } from "./src/middleware/auth.js";
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

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
