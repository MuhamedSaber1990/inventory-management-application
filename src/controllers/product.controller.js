import { generateCsrfToken } from "../config/csrf.js";
import {
  getProducts,
  getProductsByID,
  updateProducts,
  addProducts,
  deleteProduct,
} from "../models/product.model.js";

export async function showProducts(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  try {
    const products = await getProducts();
    console.log(products);
    res.render("products.ejs", { products: products, csrfToken });
  } catch (error) {
    res.status(500).send("Invalid credentials");
  }
}

export async function showAddProductForm(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  res.render("addproduct.ejs", { errorMessage: null, old: {}, csrfToken });
}

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
