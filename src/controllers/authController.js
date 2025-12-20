// Authentication controller: handles login, signup, logout, and dashboard views
import jwt from "jsonwebtoken";
import { generateCsrfToken } from "../config/csrf.js";
import {
  validateUser,
  newUser,
  lastLogin,
  findUserByEmail,
  resetPassword,
} from "../models/user.model.js";
import { sendResetPWEmail } from "../utils/mailer.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Render login page with CSRF token
export function loginPage(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  res.render("login.ejs", {
    errorMessage: null,
    old: { email: "" },
    csrfToken,
  });
}

// Process login: validate credentials, generate JWT token with configurable expiry
export async function handleLogin(req, res) {
  const { email, password, remember } = req.body;
  const rememberMe = remember === "on";

  try {
    const user = await validateUser(email, password);
    if (!user) {
      const csrfToken = generateCsrfToken(req, res);
      return res.status(401).render("login.ejs", {
        errorMessage: "Invalid email or password",
        old: { email },
        csrfToken,
      });
    }
    const previousLastLogin = user.last_login || null;
    await lastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      last_login: previousLastLogin,
    };
    const expiresIn = rememberMe ? "1d" : "1h";

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: rememberMe ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
    });
    console.log("user from DB:", user);
    console.log("user.last_login:", user.last_login);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login failed for email:", email, error);
    const csrfToken = generateCsrfToken(req, res);
    return res.status(500).render("login.ejs", {
      errorMessage: "Something went wrong. Please try again.",
      old: { email },
      csrfToken,
    });
  }
}

// Create new user account with hashed password
export async function handleSignUp(req, res) {
  const { name, email, password } = req.body;
  try {
    await newUser(name, email, password);
    res.redirect("/");
  } catch (error) {
    console.error("Error in /signup:", error);
    const csrfToken = generateCsrfToken(req, res);
    return res.status(500).render("signup.ejs", {
      errorMessage: "Could not create account. Email may already be in use.",
      old: { name, email },
      csrfToken,
    });
  }
}

// Render signup page with CSRF token
export function showSignUp(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  res.render("signup.ejs", {
    errorMessage: null,
    old: { name: "", email: "" },
    csrfToken,
  });
}

// Render dashboard with authenticated user info
export function dashboard(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  res.render("dashboard.ejs", { user: req.user, csrfToken });
}

// Clear authentication cookie and redirect to login
export function logout(req, res) {
  res.clearCookie("auth_token");
  res.redirect("/");
}

// Render forgot password
export function showForgotPW(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  res.render("forgetpw.ejs", {
    errorMessage: null,
    old: { email: "" },
    csrfToken,
  });
}

export async function handleForgotPW(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  const { email } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.render("forgetpw.ejs", {
        errorMessage: "If that email exists, a reset link has been sent.",
        old: { email },
        csrfToken,
      });
    }
    const resetLink = `http://${
      req.headers.host
    }/reset-password?email=${encodeURIComponent(user.email)}`;
    await sendResetPWEmail(email, resetLink);
    res.render("forgetpw.ejs", {
      errorMessage: "Check your email for a reset link!",
      old: { email },
      csrfToken,
    });
  } catch (error) {
    console.error("Forgot PW Error:", error);
    res.status(500).render("forgetpw.ejs", {
      errorMessage: "Error sending email. Please try again later.",
      old: { email },
      csrfToken,
    });
  }
}

export function showResetPassword(req, res) {
  const { email } = req.query; // Or token
  const csrfToken = generateCsrfToken(req, res);
  res.render("reset-password.ejs", {
    errorMessage: null,
    old: { email },
    csrfToken,
  });
}

export async function handleResetPassword(req, res) {
  const { email, password } = req.body;
  try {
    // You should verify a token here first!
    await resetPassword(password, email); // Uses your existing model function
    res.redirect("/?message=PasswordUpdated");
  } catch (error) {
    res.status(500).send("Error updating password");
  }
}
