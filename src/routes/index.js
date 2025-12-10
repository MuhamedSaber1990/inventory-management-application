// Main API router: mounts auth and product route groups
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";

const router = Router();

// Auth routes (/, /login, /signup, etc.)
router.use("/", authRoutes);

// Product routes are mounted under /products
router.use("/products", productRoutes);

export default router;
