import db from "../config/database.js";
import { randomBarCode, SKU } from "../utils/helpers.js";

// Get all categories
export async function getCategories() {
  const result = await db.query("SELECT * FROM categories ORDER BY name ASC");
  return result.rows;
}

// Handle Search AND Category logic
export async function countProducts(search = "", categoryId = "") {
  let query = "SELECT COUNT(*) FROM products WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (categoryId) {
    query += ` AND category_id = $${paramIndex}`;
    params.push(categoryId);
    paramIndex++;
  }

  const result = await db.query(query, params);
  return parseInt(result.rows[0].count, 10);
}

// Handle Search AND Category AND Pagination
export async function getProducts(limit, offset, search = "", categoryId = "") {
  let query = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (categoryId) {
    query += ` AND p.category_id = $${paramIndex}`;
    params.push(categoryId);
    paramIndex++;
  }

  query += ` ORDER BY p.id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

export async function getProductsByID(id) {
  const products = await db.query(
    `SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1`,
    [id]
  );
  return products.rows[0];
}

// Insert new product with category_id
export async function addProducts(name, price, qty, description, categoryId) {
  const insertProducts = await db.query(
    "INSERT INTO products (name, price, quantity, description, bar_code, sku, category_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [name, price, qty, description, randomBarCode(), SKU(name), categoryId]
  );
  return insertProducts.rows[0];
}

// Update product with category_id
export async function updateProducts(
  id,
  name,
  price,
  quantity,
  description,
  categoryId
) {
  const updateProduct = await db.query(
    `UPDATE products
     SET name = $1,
         price = $2,
         quantity = $3,
         description = $4,
         category_id = $5,
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [name, price, quantity, description, categoryId, id]
  );
  return updateProduct.rows[0];
}

// Delete product by ID
export async function deleteProduct(id) {
  await db.query("DELETE FROM products WHERE id = $1", [id]);
}

// Get high-level stats
export async function getDashboardStats() {
  const query = `SELECT 
    COUNT(*)::int as total_items,
    COALESCE(SUM(price * quantity), 0)::numeric(10,2) as total_value,
    COUNT(*) FILTER (WHERE quantity <= 10)::int as low_stock_count
  FROM products`;
  const result = await db.query(query);
  return result.rows[0];
}

export async function getLowStockProducts() {
  const query = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.quantity <= 10 
    ORDER BY p.quantity ASC 
    LIMIT 5
  `;
  const result = await db.query(query);
  return result.rows;
}
