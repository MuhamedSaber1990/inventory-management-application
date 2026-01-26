import dotenv from "dotenv";
import { doubleCsrf } from "csrf-csrf";

dotenv.config();

// CSRF protection: token in cookie + request body
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "a_very_secret_fallback_string",
  getSessionIdentifier: (req) => "fixed_inventory_session",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  getCsrfTokenFromRequest: (req) => req.body._csrf,
});

export { doubleCsrfProtection, generateCsrfToken };
