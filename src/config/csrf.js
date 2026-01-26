import dotenv from "dotenv";
import { doubleCsrf } from "csrf-csrf";

dotenv.config();

// CSRF protection: token in cookie + request body
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.cookies.auth_token || "guest_session",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
  getCsrfTokenFromRequest: (req) => req.body._csrf,
});

export { doubleCsrfProtection, generateCsrfToken };
