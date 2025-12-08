import db from "../config/database.js";
import { randomBarCode, SKU } from "../utils/helpers.js";

// Fetch all products ordered by ID
export async function getProducts() {
  const products = await db.query("Select * from products ORDER BY id ASC");
  return products.rows;
}

// Fetch single product by ID
export async function getProductsByID(id) {
  const products = await db.query("Select * from products WHERE id = $1", [id]);
  return products.rows[0];
}

// Insert new product with generated barcode
export async function addProducts(name, price, qty, description) {
  const insertProducts = await db.query(
    "INSERT INTO products (name, price, quantity, description, bar_code,sku) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [name, price, qty, description, randomBarCode(), SKU(name)]
  );
  return insertProducts.rows[0];
}

// Update product and set updated_at timestamp
export async function updateProducts(id, name, price, quantity, description) {
  const updateProduct = await db.query(
    `UPDATE products
     SET name = $1,
         price = $2,
         quantity = $3,
         description = $4,
         updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [name, price, quantity, description, id]
  );
  return updateProduct.rows[0];
}

// Delete product by ID
export async function deleteProduct(id) {
  await db.query("DELETE FROM products WHERE id = $1", [id]);
}
