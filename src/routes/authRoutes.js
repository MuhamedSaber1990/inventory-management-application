// Auth routes: login, signup, dashboard, logout
// Mounted at `/` in the main router
import { Router } from "express";
import { doubleCsrfProtection } from "../config/csrf.js";
import { requireAuth, redirectIfAuth } from "../middleware/auth.js";

import {
  validateSignUpRules,
  validationSignUpInput,
  loginValidation,
} from "../middleware/authValidators.js";
import { loginLimiter, signUpLimiter } from "../middleware/rateLimiters.js";
import * as authController from "../controllers/authController.js";

const router = Router();

router.get("/", redirectIfAuth, authController.loginPage);
router.post(
  "/login",
  doubleCsrfProtection,
  loginLimiter,
  loginValidation,
  authController.handleLogin
);
router.get("/signup", redirectIfAuth, authController.showSignUp);
router.post(
  "/signup",
  doubleCsrfProtection,
  signUpLimiter,
  validateSignUpRules,
  validationSignUpInput,
  authController.handleSignUp
);
router.get("/forgot-password", redirectIfAuth, authController.showForgotPW);
router.post(
  "/forgot-password",
  doubleCsrfProtection,
  authController.handleForgotPW
);
router.get("/dashboard", requireAuth, authController.dashboard);
router.post("/logout", doubleCsrfProtection, authController.logout);

router.get("/reset-password", authController.showResetPassword);
router.post("/reset-password", authController.handleResetPassword);

export default router;
