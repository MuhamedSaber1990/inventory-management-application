import db from "../config/database.js";
import { randomBarCode, SKU } from "../utils/helpers.js";

export async function getCategories() {
  const result = await db.query(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC"
  );
  return result.rows;
}

// Handle Search AND Category logic
export async function countProducts(search = "", category = "") {
  let query = "SELECT COUNT(*) FROM products WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (category) {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  const result = await db.query(query, params);
  return parseInt(result.rows[0].count, 10);
}

//Handle Search AND Category AND Pagination
export async function getProducts(limit, offset, search = "", category = "") {
  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (category) {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  query += ` ORDER BY id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

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

// Get high-level stats (Total Count, Total Value, Low Stock Count)
export async function getDashboardStats() {
  const query = `SELECT 
    COUNT(*)::int as total_items,
    COALESCE(SUM(price * quantity), 0)::numeric(10,2) as total_value,
    COUNT(*) FILTER (WHERE quantity <= 10)::int as low_stock_count
  FROM products
   `;
  const result = await db.query(query);
  return result.rows[0];
}

export async function getLowStockProducts() {
  const query =
    "SELECT * FROM products WHERE quantity <= 10 ORDER BY quantity ASC LIMIT 5";
  const result = await db.query(query);
  return result.rows;
}
