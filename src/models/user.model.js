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
export async function newUser(
  name,
  email,
  password,
  verificationToken,
  tokenExpiry
) {
  const passwordHash = await hashPw(password);
  const insertUser = await db.query(
    "INSERT INTO users (name, email, password_hash,verification_token,verification_token_expiry) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [name, email.toLowerCase(), passwordHash, verificationToken, tokenExpiry]
  );
  return insertUser.rows[0];
}

export async function lastLogin(userId) {
  await db.query("UPDATE users SET last_login = NOW() WHERE id =$1", [userId]);
}

export async function findUserByEmail(email) {
  const insertEmail = await db.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return insertEmail.rows[0];
}
export async function setResetToken(resetToken, expiry, email) {
  const result = await db.query(
    "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3 RETURNING *",
    [resetToken, expiry, email]
  );
  return result.rows[0];
}

export async function resetPassword(password, email) {
  const passwordHash = await hashPw(password);
  const insertUser = await db.query(
    "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email =$2",
    [passwordHash, email.toLowerCase()]
  );
  return insertUser.rows[0];
}

export async function findUserByResetToken(token) {
  const result = await db.query(
    "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
    [token]
  );
  return result.rows[0];
}

export async function verifyUserToken(token) {
  const result = await db.query(
    "UPDATE users SET email_verified = true, verification_token = NULL, verification_token_expiry = NULL WHERE verification_token = $1 AND verification_token_expiry > NOW() RETURNING *",
    [token]
  );
  return result.rows[0];
}
