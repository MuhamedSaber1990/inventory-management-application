import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";
import { generateCsrfToken, doubleCsrfProtection } from "./src/config/csrf.js";
import { hashPw, validateUser, newUser } from "./src/models/user.model.js";
import {
  getProducts,
  getProductsByID,
  updateProducts,
  addProducts,
  deleteProduct,
} from "./src/models/product.model.js";
import { requireAuth } from "./src/middleware/auth.js";
import {
  validationSignUpInput,
  validateAddProducts,
  validateUpdateProducts,
} from "./src/middleware/validation.js";
import { loginLimiter, signUpLimiter } from "./src/middleware/rateLimiters.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

const validateSignUpRules = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be 2 characters atleast"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password length must be atleast 8")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

const productRules = [
  body("name")
    .trim()
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
    .isLength({ min: 1, max: 5000 })
    .withMessage("Description must be 1-5000 characters long"),
];

app.get("/", (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.render("login.ejs", {
    errorMessage: null,
    old: { email: "" },
    csrfToken,
  });
});

app.post("/login", doubleCsrfProtection, loginLimiter, async (req, res) => {
  const { email, password, remember } = req.body;
  const rememberMe = remember === "on";

  try {
    const user = await validateUser(email, password);
    if (!user) {
      const csrfToken = generateCsrfToken(req, res);
      return res.status(401).render("login.ejs", {
        errorMessage: "Invalid email or password",
        old: { email },
        csrfToken,
      });
    }
    const payload = { id: user.id, email: user.email, name: user.name };
    const expiresIn = rememberMe ? "1d" : "1h";

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: rememberMe ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
    });

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login failed for email:", email, error);
    const csrfToken = generateCsrfToken(req, res);
    return res.status(500).render("login.ejs", {
      errorMessage: "Something went wrong. Please try again.",
      old: { email },
      csrfToken,
    });
  }
});

app.get("/signup", (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.render("signup.ejs", {
    errorMessage: null,
    old: { name: "", email: "" },
    csrfToken,
  });
});

app.post(
  "/signup",
  doubleCsrfProtection,
  signUpLimiter,
  validateSignUpRules,
  validationSignUpInput,
  async (req, res) => {
    const { name, email, password } = req.body;
    try {
      await newUser(name, email, password);
      res.redirect("/");
    } catch (error) {
      console.error("Error in /signup:", error);
      const csrfToken = generateCsrfToken(req, res);
      return res.status(500).render("signup.ejs", {
        errorMessage: "Could not create account. Email may already be in use.",
        old: { name, email },
        csrfToken,
      });
    }
  }
);

app.get("/dashboard", requireAuth, (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.render("dashboard.ejs", { user: req.user, csrfToken });
});

app.post("/logout", doubleCsrfProtection, (req, res) => {
  res.clearCookie("auth_token");
  res.redirect("/");
});

app.get("/products", requireAuth, async (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  try {
    const products = await getProducts();
    console.log(products);
    res.render("products.ejs", { products: products, csrfToken });
  } catch (error) {
    res.status(500).send("Invalid credentials");
  }
});

app.get("/products/add", requireAuth, (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.render("addproduct.ejs", { errorMessage: null, old: {}, csrfToken });
});

app.post(
  "/products/new",
  requireAuth,
  doubleCsrfProtection,
  productRules,
  validateAddProducts,
  async (req, res) => {
    const { name, price, quantity, description } = req.body;
    try {
      await addProducts(name, price, quantity, description);
      // console.log(input);
      res.redirect("/products");
    } catch (error) {
      console.error("Error in /products/new:", error);
      const csrfToken = generateCsrfToken(req, res);
      const { name, price, quantity, description } = req.body;
      res.status(500).render("addproduct.ejs", {
        errorMessage: "Server error while creating product",
        old: { name, price, quantity, description },
        csrfToken,
      });
    }
  }
);

app.get("/products/edit/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const csrfToken = generateCsrfToken(req, res);
  try {
    const product = await getProductsByID(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.render("editproduct.ejs", { product, csrfToken });
  } catch (err) {
    console.error("Error loading product for edit:", err);
    res.status(500).send("Error loading product");
  }
});

app.post(
  "/products/edit/:id",
  requireAuth,
  doubleCsrfProtection,
  productRules,
  validateUpdateProducts,
  async (req, res) => {
    const { name, price, quantity, description } = req.body;
    const { id } = req.params;
    try {
      await updateProducts(id, name, price, quantity, description);
      res.redirect("/products");
    } catch (error) {
      console.error("Error in /products/edit:", error);
      res.status(500).send("Invalid credentials");
    }
  }
);

app.post(
  "/products/delete/:id",
  requireAuth,
  doubleCsrfProtection,
  async (req, res) => {
    const { id } = req.params;
    try {
      await deleteProduct(id);
      res.redirect("/products");
    } catch (error) {
      console.error("Error in /products/delete:", error);
      res.status(500).send("Invalid credentials");
    }
  }
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
