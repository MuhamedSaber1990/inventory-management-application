import dotenv from "dotenv";
import { doubleCsrf } from "csrf-csrf";

dotenv.config();

// CSRF protection: token in cookie + request body
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.cookies.auth_token || req.ip,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: false,
    sameSite: "lax",
    secure: false,
  },
  getCsrfTokenFromRequest: (req) => req.body._csrf,
});

export { doubleCsrfProtection, generateCsrfToken };
