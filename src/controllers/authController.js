// Authentication controller: handles login, signup, logout, and dashboard views
import jwt from "jsonwebtoken";
import { generateCsrfToken } from "../config/csrf.js";
import {
  validateUser,
  newUser,
  lastLogin,
  findUserByEmail,
  resetPassword,
  setResetToken,
  verifyUserToken,
} from "../models/user.model.js";
import { sendResetPWEmail, sendEmailVerfication } from "../utils/mailer.js";
import { generateRandomToken } from "../utils/passwordUtils.js";
import { findUserByResetToken } from "../models/user.model.js";
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

// Create new user account with hashed password & verficationToken
export async function handleSignUp(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  const { name, email, password } = req.body;
  const expiry = new Date(Date.now() + 86400000);
  const token = generateRandomToken();
  const resetLink = `http://${req.headers.host}/activate-account/${token}`;
  try {
    await newUser(name, email, password, token, expiry);
    await sendEmailVerfication(email, resetLink);
    res.render("signup-success.ejs", {
      message: "Please check your email to activate your account.",
      old: { email },
      csrfToken,
    });
  } catch (error) {
    console.error("Error in /signup:", error);
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
    const token = generateRandomToken();
    const resetLink = `http://${req.headers.host}/reset-password/${token}`;
    const expiry = new Date(Date.now() + 900000);
    await setResetToken(token, expiry, email);
    await sendResetPWEmail(email, resetLink);
    res.render("forgetpw.ejs", {
      errorMessage:
        "If that account exists, a reset link has been sent to your email.",
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

export async function showResetPassword(req, res) {
  const { token } = req.params;
  const csrfToken = generateCsrfToken(req, res);
  try {
    const user = await findUserByResetToken(token);
    if (!user) {
      return res.status(400).render("error.ejs", {
        title: "Invalid Link",
        errorMessage: "Token is invalid or expired.",
        status: 400,
      });
    }
    res.render("reset-password.ejs", {
      errorMessage: null,
      token,
      old: { email: user.email },
      csrfToken,
    });
  } catch (error) {
    console.error("confirming tokenError:", error);
    res.status(500).render("error.ejs", {
      title: "Server Error",
      message: "Error confirming token. Please try again later.",
      status: 500,
    });
  }
}

export async function handleResetPassword(req, res) {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  const csrfToken = generateCsrfToken(req, res);
  if (password !== confirmPassword) {
    return res.render("reset-password.ejs", {
      token,
      errorMessage: "Passwords do not match",
      csrfToken,
    });
  }
  try {
    const user = await findUserByResetToken(token);
    if (!user) {
      return res.status(400).render("reset-password.ejs", {
        token,
        errorMessage: "Invalid token",
        csrfToken,
      });
    }

    await resetPassword(password, user.email);
    res.redirect("/?success=Your password has been updated. Please log in.");
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).render("reset-password.ejs", {
      token,
      errorMessage: "An internal error occurred. Please try again.",
      csrfToken,
      old: { email: "" },
    });
  }
}

export async function handleAccountVerfifcation(req, res) {
  const { token } = req.params;
  const csrfToken = generateCsrfToken(req, res);
  try {
    const user = await verifyUserToken(token);
    if (!user) {
      return res.status(400).render("login.ejs", {
        errorMessage:
          "Invalid or expired activation link. Please sign up again.",
        csrfToken,
        old: null,
      });
    }

    res.render("login.ejs", {
      success: "Account activation success",
      old: { email: user.email },
      csrfToken,
    });
  } catch (error) {
    console.error("Activation Error:", error);
    return res.status(500).render("login.ejs", {
      errorMessage: "Something went wrong during activation. Please try again.",
      csrfToken,
      old: null,
    });
  }
}
