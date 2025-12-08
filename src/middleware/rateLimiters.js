// Rate limiting middleware: prevents brute force attacks on login and signup
import rateLimit from "express-rate-limit";
import { generateCsrfToken } from "../config/csrf.js";

// Limit login attempts to 5 per 15 minutes
export const loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const email = req.body?.email || "";
    const csrfToken = generateCsrfToken(req, res);
    return res.status(429).render("login.ejs", {
      errorMessage: "Too many login attempts. Please try again later.",
      old: { email },
      csrfToken,
    });
  },
});

// Limit signup attempts to 5 per hour
export const signUpLimiter = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const name = req.body?.name || "";
    const email = req.body?.email || "";
    const csrfToken = generateCsrfToken(req, res);
    return res.status(429).render("signup.ejs", {
      errorMessage: "Too many signup attempts. Please try again later.",
      old: { name, email },
      csrfToken,
    });
  },
});
