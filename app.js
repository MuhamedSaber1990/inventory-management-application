import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

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
async function addProducts(name, price, qty, Description) {
  const insertProducts = await db.query(
    "INSERT INTO products (name, price, quantity, description, bar_code) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [name, price, qty, Description, randomBarCode()]
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

app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", async (req, res) => {
  const { email, password, remember } = req.body;
  const rememberMe = remember === "on";

  try {
    const user = await validateUser(email, password);
    if (!user) {
      return res.send("incorrect input");
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
    res.status(500).send("Error loading items");
  }
});

app.get("/signup", async (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const result = await newUser(name, email, password);
    console.log(result);
    res.redirect("/");
  } catch (error) {
    res.status(500).send("Incorrect inputs");
  }
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard.ejs", { user: req.user });
});

app.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.redirect("/");
});

app.get("/products", requireAuth, async (req, res) => {
  try {
    const products = await getProducts();
    console.log(products);
    res.render("products.ejs", { products: products });
  } catch (error) {
    res.status(500).send("Incorrect inputs");
  }
});

app.get("/products/add", requireAuth, (req, res) => {
  res.render("addproduct.ejs");
});

app.post("/products/new", requireAuth, async (req, res) => {
  const { name, price, quantity, description } = req.body;
  try {
    const input = await addProducts(
      name,
      parseFloat(price),
      parseInt(quantity),
      description
    );
    // console.log(input);
    res.redirect("/products");
  } catch (error) {
    console.error("Error in /products/new:", error);
    res.status(500).send("Incorrect inputs");
  }
});

app.get("/products/edit/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await getProductsByID(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.render("editproduct.ejs", { product });
  } catch (err) {
    console.error("Error loading product for edit:", err);
    res.status(500).send("Error loading product");
  }
});

app.post("/products/edit/:id", requireAuth, async (req, res) => {
  const { name, price, quantity, description } = req.body;
  const { id } = req.params;
  try {
    const updatedInput = await updateProducts(
      parseInt(id),
      name,
      parseFloat(price),
      parseInt(quantity),
      description
    );
    res.redirect("/products");
  } catch (error) {
    console.error("Error in /products/new:", error);
    res.status(500).send("Incorrect inputs");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
