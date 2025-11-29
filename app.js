import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { doubleCsrf } from "csrf-csrf";

dotenv.config();
const app = express();
const port = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.cookies.auth_token || req.ip,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: false,
    sameSite: "lax",
    secure: false,
  },
  getCsrfTokenFromRequest: (req) => req.body._csrf,
});

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

const loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const email = req.body?.email || "";
    const csrfToken = generateCsrfToken(req, res);
    return res.status(429).render("login.ejs", {
      errorMessage: "Too many login attempts. Please try again later.",
      old: { email },
      csrfToken,
    });
  },
});

const signUpLimiter = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const name = req.body?.name || "";
    const email = req.body?.email || "";
    const csrfToken = generateCsrfToken(req, res);
    return res.status(429).render("signup.ejs", {
      errorMessage: "Too many signup attempts. Please try again later.",
      old: { name, email },
      csrfToken,
    });
  },
});

function validationSignUpInput(req, res, next) {
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
function validateAddProducts(req, res, next) {
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

function validateUpdateProducts(req, res, next) {
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

function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.redirect("/");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.redirect("/");
  }
}

async function hashPw(password) {
  const saltRound = 10;
  const hashPw = await bcrypt.hash(password, saltRound);
  return hashPw;
}

async function validateUser(email, password) {
  const data = await db.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  if (data.rows.length === 0) return false;

  const user = data.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (match) {
    return user;
  } else {
    return false;
  }
}

async function newUser(name, email, password) {
  const passwordHash = await hashPw(password);
  const insertUser = await db.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING *",
    [name, email.toLowerCase(), passwordHash]
  );
  return insertUser.rows[0];
}

async function getProducts() {
  const products = await db.query("Select * from products ORDER BY id ASC");
  return products.rows;
}
async function getProductsByID(id) {
  const products = await db.query("Select * from products WHERE id = $1", [id]);
  return products.rows[0];
}

function randomBarCode(length = 13) {
  let code = "";
  for (let index = 0; index < length; index++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}
async function addProducts(name, price, qty, description) {
  const insertProducts = await db.query(
    "INSERT INTO products (name, price, quantity, description, bar_code) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [name, price, qty, description, randomBarCode()]
  );
  return insertProducts.rows[0];
}

async function updateProducts(id, name, price, quantity, description) {
  const updateProduct = await db.query(
    `UPDATE products
     SET name = $1,
         price = $2,
         quantity = $3,
         description = $4
     WHERE id = $5
     RETURNING *`,
    [name, price, quantity, description, id]
  );
  return updateProduct.rows[0];
}

async function deleteProduct(id) {
  await db.query("DELETE FROM products WHERE id = $1", [id]);
}

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
    return res.status(500).render("login.ejs", {
      errorMessage: "Something went wrong. Please try again.",
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
      res.status(500).send("Server error while creating product");
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
