import { generateCsrfToken } from "../config/csrf.js";
import {
  getProducts,
  countProducts,
  getCategories,
  getProductsByID,
  updateProducts,
  addProducts,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateQuantity,
  bulkUpdateCategory,
} from "../models/productModel.js";

// Fetch and display all products
export async function showProducts(req, res) {
  const csrfToken = generateCsrfToken(req, res);

  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const categoryId = req.query.category || "";

  if (limit < 1) limit = 10;
  if (limit > 80) limit = 80;

  const offset = (page - 1) * limit;

  try {
    const [products, totalItems, categories] = await Promise.all([
      getProducts(limit, offset, search, categoryId),
      countProducts(search, categoryId),
      getCategories(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.render("products.ejs", {
      products,
      categories,
      selectedCategory: categoryId,
      csrfToken,
      currentPage: page,
      totalPages,
      totalItems,
      currentLimit: limit,
      search,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products");
  }
}

// Display add product form
export async function showAddProductForm(req, res) {
  const csrfToken = generateCsrfToken(req, res);

  try {
    const categories = await getCategories();
    res.render("addproduct.ejs", {
      errorMessage: null,
      old: {},
      categories,
      csrfToken,
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    res.status(500).send("Error loading form");
  }
}

// Create new product
export async function addProductHandler(req, res) {
  const { name, price, quantity, description, category_id } = req.body;

  try {
    await addProducts(name, price, quantity, description, category_id || null);
    res.redirect("/products");
  } catch (error) {
    console.error("Error creating product:", error);
    const csrfToken = generateCsrfToken(req, res);
    const categories = await getCategories();

    res.status(500).render("addproduct.ejs", {
      errorMessage: "Server error while creating product",
      old: { name, price, quantity, description, category_id },
      categories,
      csrfToken,
    });
  }
}

// Load product for editing
export async function updateProductsFrom(req, res) {
  const { id } = req.params;
  const csrfToken = generateCsrfToken(req, res);

  try {
    const [product, categories] = await Promise.all([
      getProductsByID(id),
      getCategories(),
    ]);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("editproduct.ejs", {
      product,
      categories,
      csrfToken,
    });
  } catch (err) {
    console.error("Error loading product for edit:", err);
    res.status(500).send("Error loading product");
  }
}

// Update product
export async function updateProductHandler(req, res) {
  const { name, price, quantity, description, category_id } = req.body;
  const { id } = req.params;

  try {
    await updateProducts(
      id,
      name,
      price,
      quantity,
      description,
      category_id || null
    );
    res.redirect("/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
}

// Delete product
export async function deleteProductHandler(req, res) {
  const { id } = req.params;

  try {
    await deleteProduct(id);
    res.redirect("/products");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Error deleting product");
  }
}

// Handle Bulk Delete
export async function handleBulkDelete(req, res) {
  const { ids } = req.body;
  if (!ids) return res.redirect("/products");

  try {
    const idArray = ids.split(",");
    await bulkDeleteProducts(idArray);
    res.redirect("/products");
  } catch (error) {
    console.error("Bulk Delete Error:", error);
    res.status(500).send("Error deleting products");
  }
}

// Handle Bulk Quantity Change
export async function handleBulkQuantity(req, res) {
  const { ids, quantity } = req.body;
  if (!ids) return res.redirect("/products");

  try {
    const idArray = ids.split(",");
    const qtyValue = parseInt(quantity, 10);

    if (isNaN(qtyValue) || qtyValue < 0) {
      return res.status(400).send("Invalid quantity");
    }

    await bulkUpdateQuantity(idArray, qtyValue);
    res.redirect("/products");
  } catch (error) {
    console.error("Bulk Quantity Error:", error);
    res.status(500).send("Error updating quantities");
  }
}

// Handle Bulk Category Change
export async function handleBulkCategory(req, res) {
  const { ids, category_id } = req.body;
  if (!ids) return res.redirect("/products");

  try {
    const idArray = ids.split(",");
    await bulkUpdateCategory(idArray, category_id);
    res.redirect("/products");
  } catch (error) {
    console.error("Bulk Category Error:", error);
    res.status(500).send("Error updating categories");
  }
}
