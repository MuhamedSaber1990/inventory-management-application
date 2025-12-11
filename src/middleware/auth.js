import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware: verify JWT token from auth_token cookie
export function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.redirect("/");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.redirect("/");
  }
}

// Redirect if already authenticated
export function redirectIfAuth(req, res, next) {
  const token = req.cookies.auth_token;

  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect("/dashboard");
    } catch (error) {
      res.clearCookie("auth_token");
    }
  }

  next();
}
