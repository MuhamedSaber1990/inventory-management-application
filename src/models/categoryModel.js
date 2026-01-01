import db from "../config/database.js";

// Get all categories
export async function getAllCategories() {
  const result = await db.query("SELECT * FROM categories ORDER BY name ASC");
  return result.rows;
}

// Get category by ID
export async function getCategoryById(id) {
  const result = await db.query("SELECT * FROM categories WHERE id = $1", [id]);
  return result.rows[0];
}

// Create new category
export async function createCategory(name, description) {
  const result = await db.query(
    "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
    [name, description || null]
  );
  return result.rows[0];
}

// Update category
export async function updateCategory(id, name, description) {
  const result = await db.query(
    `UPDATE categories 
     SET name = $1, description = $2, updated_at = NOW() 
     WHERE id = $3 
     RETURNING *`,
    [name, description || null, id]
  );
  return result.rows[0];
}

// Delete category
export async function deleteCategory(id) {
  // First, move all products to "Uncategorized"
  const uncategorizedId = await db.query(
    "SELECT id FROM categories WHERE name = 'Uncategorized'"
  );

  if (uncategorizedId.rows.length > 0) {
    await db.query(
      "UPDATE products SET category_id = $1 WHERE category_id = $2",
      [uncategorizedId.rows[0].id, id]
    );
  }

  // Then delete the category
  await db.query("DELETE FROM categories WHERE id = $1", [id]);
}

// Count products in category
export async function countProductsInCategory(categoryId) {
  const result = await db.query(
    "SELECT COUNT(*) FROM products WHERE category_id = $1",
    [categoryId]
  );
  return parseInt(result.rows[0].count, 10);
}

// Check if category name exists (for validation)
export async function categoryNameExists(name, excludeId = null) {
  let query = "SELECT COUNT(*) FROM categories WHERE name = $1";
  const params = [name];

  if (excludeId) {
    query += " AND id != $2";
    params.push(excludeId);
  }

  const result = await db.query(query, params);
  return parseInt(result.rows[0].count, 10) > 0;
}
