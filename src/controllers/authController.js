// Authentication controller: handles login, signup, logout, and dashboard views
import jwt from "jsonwebtoken";
import { generateCsrfToken } from "../config/csrf.js";
import { validateUser, newUser, lastLogin } from "../models/user.model.js";
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
