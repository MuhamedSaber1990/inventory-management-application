// Product controller: handles product CRUD operations and form rendering
import { generateCsrfToken } from "../config/csrf.js";
import {
  getProducts,
  countProducts,
  getProductsByID,
  updateProducts,
  addProducts,
  deleteProduct,
} from "../models/productModel.js";

// Fetch and display all products
export async function showProducts(req, res) {
  const csrfToken = generateCsrfToken(req, res);

  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;

  //min 10 & max 80
  if (limit < 1) limit = 10;
  if (limit > 80) limit = 80;

  //Calculate Offset
  const offset = (page - 1) * limit;

  try {
    const [products, totalItems] = await Promise.all([
      getProducts(limit, offset),
      countProducts(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    console.log(products);
    res.render("products.ejs", {
      products,
      csrfToken,
      currentPage: page,
      totalPages,
      totalItems,
      currentLimit: limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Invalid credentials");
  }
}

// Display add product form
export async function showAddProductForm(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  res.render("addproduct.ejs", { errorMessage: null, old: {}, csrfToken });
}

// Create new product and redirect to product list
export async function addProductHandler(req, res) {
  const { name, price, quantity, description } = req.body;
  try {
    await addProducts(name, price, quantity, description);
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
// Load product for editing
export async function updateProductsFrom(req, res) {
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
}

// Update product details and redirect to product list
export async function updateProductHandeler(req, res) {
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

// Delete product and redirect to product list
export async function deleteProductHandler(req, res) {
  const { id } = req.params;
  try {
    await deleteProduct(id);
    res.redirect("/products");
  } catch (error) {
    console.error("Error in /products/delete:", error);
    res.status(500).send("Invalid credentials");
  }
}
