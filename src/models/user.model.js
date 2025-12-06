import bcrypt from "bcrypt";
import db from "../config/database.js";

// Hash password with bcrypt
export async function hashPw(password) {
  const saltRound = 10;
  const hashPw = await bcrypt.hash(password, saltRound);
  return hashPw;
}

// Validate email and password against database
export async function validateUser(email, password) {
  const data = await db.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  if (data.rows.length === 0) return false;

  const user = data.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  return match ? user : false;
}

// Create new user with hashed password
export async function newUser(name, email, password) {
  const passwordHash = await hashPw(password);
  const insertUser = await db.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING *",
    [name, email.toLowerCase(), passwordHash]
  );
  return insertUser.rows[0];
}
