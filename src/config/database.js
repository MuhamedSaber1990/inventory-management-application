import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,

  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

db.query("SELECT 1")
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

// // Use a connection pool so callers can `await db.connect()` safely
// const db = new pg.Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// });

// const connectDB = async () => {
//   try {
//     const client = await db.connect();
//     client.release();
//     console.log("✅ Database pool created and connection verified");
//   } catch (error) {
//     console.error("❌ Database connection failed:", error.message);
//     process.exit(1);
//   }
// };

// connectDB();

export default db;
