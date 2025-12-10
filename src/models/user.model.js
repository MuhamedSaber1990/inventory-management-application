import { comparePassword, hashPw } from "../utils/passwordUtils.js";
import db from "../config/database.js";

// Validate email and password against database
export async function validateUser(email, password) {
  const data = await db.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  if (data.rows.length === 0) return false;

  const user = data.rows[0];
  const match = await comparePassword(password, user.password_hash);
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

export async function lastLogin(userId) {
  await db.query("UPDATE users SET last_login = NOW() WHERE id =$1", [userId]);
}
