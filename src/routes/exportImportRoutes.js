import { Router } from "express";
import multer from "multer";
import { doubleCsrfProtection } from "../config/csrf.js";
import { requireAuth } from "../middleware/auth.js";
import * as exportImportController from "../controllers/exportImportController.js";

// Configure Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Protect routes
router.use(requireAuth);

// Export Routes
router.get("/export/products/csv", exportImportController.exportProductsCSV);

// Show import page
router.get("/import", exportImportController.showImportPage);

// Import products from CSV
router.post(
  "/import/products",
  upload.single("csvFile"),
  doubleCsrfProtection,
  exportImportController.importProductsCSV
);

export default router;
