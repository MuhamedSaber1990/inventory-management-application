import db from "../config/database.js";

// 1. Get Log Feed
export async function getRecentActivity(limit = 10) {
  const query = `
    SELECT l.*, u.name as user_name 
    FROM activity_logs l
    LEFT JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC 
    LIMIT $1
  `;
  const result = await db.query(query, [limit]);
  return result.rows;
}

// 2. Helper to insert logs
export async function logActivity(userId, action, description) {
  await db.query(
    "INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)",
    [userId, action, description]
  );
}

// 3. Chart Data: Stock Value by Category (Pie Chart)
export async function getCategoryStockStats() {
  const query = `
    SELECT 
      COALESCE(c.name, 'Uncategorized') as category,
      SUM(p.price * p.quantity)::numeric(10,2) as total_value
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
    HAVING SUM(p.price * p.quantity) > 0
    ORDER BY total_value DESC
  `;

  try {
    const result = await db.query(query);
    // console.log("Pie Chart Data:", result.rows);
    return result.rows;
  } catch (error) {
    console.error("Error fetching category stats:", error);
    return [];
  }
}

// 4. Chart Data: Products Created per Month (Line Graph)
export async function getMonthlyTrends() {
  const query = `
    WITH months AS (
      -- Get the earliest product creation date
      SELECT 
        DATE_TRUNC('month', MIN(created_at)) as start_date,
        DATE_TRUNC('month', NOW()) as end_date
      FROM products
    ),
    month_series AS (
      SELECT 
        TO_CHAR(generate_series, 'Mon YYYY') as month,
        generate_series as date_trunc
      FROM months,
      LATERAL generate_series(
        start_date,
        end_date,
        '1 month'::interval
      ) generate_series
    )
    SELECT 
      ms.month,
      COALESCE(COUNT(p.id)::int, 0) as count
    FROM month_series ms
    LEFT JOIN products p ON 
      DATE_TRUNC('month', p.created_at) = ms.date_trunc
    GROUP BY ms.month, ms.date_trunc
    ORDER BY ms.date_trunc ASC
  `;

  try {
    const result = await db.query(query);
    // console.log("Line Chart Data (All Time):", result.rows);
    return result.rows;
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    return [];
  }
}
