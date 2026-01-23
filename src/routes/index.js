// Main API router: mounts auth, product, and category route groups
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import exportImportRoutes from "./exportImportRoutes.js";
import apiRoutes from "./apiRoutes.js";

const router = Router();

// Auth routes (/, /login, /signup, etc.)
router.use("/", authRoutes);

// Product routes are mounted under /products
router.use("/products", productRoutes);

// Category routes are mounted under /categories
router.use("/categories", categoryRoutes);

router.use("/data", exportImportRoutes);

router.use("/api", apiRoutes);

export default router;
