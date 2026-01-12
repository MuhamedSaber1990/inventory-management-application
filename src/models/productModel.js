import db from "../config/database.js";
import { randomBarCode, SKU } from "../utils/helpers.js";

// Get all categories
export async function getCategories() {
  const result = await db.query("SELECT * FROM categories ORDER BY name ASC");
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

// Handle Search AND Category logic
export async function countProducts(
  search = "",
  categoryId = "",
  filters = {}
) {
  const { minPrice, maxPrice, stockStatus, fromDate, toDate } = filters;

  const filterData = buildFilterQuery(
    search,
    categoryId,
    minPrice,
    maxPrice,
    stockStatus,
    fromDate,
    toDate
  );

  const query = `
    SELECT COUNT(*) 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
    ${filterData.clause}
  `;

  const result = await db.query(query, filterData.params);
  return parseInt(result.rows[0].count, 10);
}

// Handle Search AND Category AND Pagination
export async function getProducts(
  limit,
  offset,
  search = "",
  categoryId = "",
  filters = {}
) {
  const {
    minPrice,
    maxPrice,
    stockStatus,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  } = filters;

  const filterData = buildFilterQuery(
    search,
    categoryId,
    minPrice,
    maxPrice,
    stockStatus,
    fromDate,
    toDate
  );
  let { clause, params, idx } = filterData;

  // 6. Sorting (Whitelist to prevent SQL Injection)
  const validSorts = ["id", "name", "price", "quantity", "created_at"];
  const validOrders = ["ASC", "DESC"];

  const safeSortBy = validSorts.includes(sortBy) ? `p.${sortBy}` : "p.id";
  const safeOrder = validOrders.includes(sortOrder?.toUpperCase())
    ? sortOrder.toUpperCase()
    : "ASC";

  const query = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${clause}
    ORDER BY ${safeSortBy} ${safeOrder}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
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

export async function getAllProductsForExport() {
  const query = ` SELECT
  p.id,
  p.name,
  p.sku,
  p.bar_code,
  p.price,
  p.quantity,
  p.description,
  c.name as category_name,
  p.created_at,
  p.updated_at
  FROM products p
  LEFT JOIN categories c ON P.category_id = c.id
  ORDER BY p.id ASC
  `;
  const result = await db.query(query);
  return result.rows;
}

// Bulk import products
export async function importProductsBulk(products) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let successCount = 0;

    for (const product of products) {
      try {
        await client.query(
          `INSERT INTO products (name, sku, bar_code, price, quantity, description, category_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (sku) DO UPDATE
           SET 
             name = EXCLUDED.name,
             bar_code = EXCLUDED.bar_code,
             price = EXCLUDED.price,
             quantity = EXCLUDED.quantity,
             description = EXCLUDED.description,
             category_id = EXCLUDED.category_id,
             updated_at = NOW()`,
          [
            product.name,
            product.sku,
            product.bar_code,
            product.price,
            product.quantity,
            product.description,
            product.category_id,
          ]
        );
        successCount++;
      } catch (error) {
        console.error(`Error importing product ${product.name}:`, error);
        // Continue with other products even if one fails
      }
    }

    await client.query("COMMIT");
    return { success: true, count: successCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Bulk Delete
export async function bulkDeleteProducts(ids) {
  // ids is an array [1, 2, 3]
  await db.query("DELETE FROM products WHERE id = ANY($1::int[])", [ids]);
}

// Bulk Set Quantity
export async function bulkUpdateQuantity(ids, quantity) {
  await db.query(
    "UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = ANY($2::int[])",
    [quantity, ids]
  );
}

// Bulk Assign Category
export async function bulkUpdateCategory(ids, categoryId) {
  await db.query(
    "UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = ANY($2::int[])",
    [categoryId, ids]
  );
}

function buildFilterQuery(
  search,
  categoryId,
  minPrice,
  maxPrice,
  stockStatus,
  fromDate,
  toDate
) {
  let clause = " WHERE 1=1";
  const params = [];
  let idx = 1;

  // 1. Search
  if (search) {
    clause += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.description ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  // 2. Category
  if (categoryId) {
    clause += ` AND p.category_id = $${idx}`;
    params.push(categoryId);
    idx++;
  }

  // 3. Price Range
  if (minPrice) {
    clause += ` AND p.price >= $${idx}`;
    params.push(minPrice);
    idx++;
  }
  if (maxPrice) {
    clause += ` AND p.price <= $${idx}`;
    params.push(maxPrice);
    idx++;
  }

  // 4. Stock Level
  if (stockStatus) {
    if (stockStatus === "out") {
      clause += ` AND p.quantity = 0`;
    } else if (stockStatus === "low") {
      // Assuming 'low' means <= min_quantity (usually 10) but > 0
      clause += ` AND p.quantity > 0 AND p.quantity <= p.min_quantity`;
    } else if (stockStatus === "in") {
      clause += ` AND p.quantity > p.min_quantity`;
    }
  }

  // 5. Date Range (Created At)
  if (fromDate) {
    clause += ` AND p.created_at >= $${idx}`;
    params.push(fromDate);
    idx++;
  }
  if (toDate) {
    // Add 1 day to include the end date fully
    clause += ` AND p.created_at <= $${idx}::date + interval '1 day'`;
    params.push(toDate);
    idx++;
  }

  return { clause, params, idx };
}
