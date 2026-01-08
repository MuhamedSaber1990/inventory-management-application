import { Router } from "express";
import multer from "multer";
import { doubleCsrfProtection } from "../config/csrf.js";
import { requireAuth } from "../middleware/auth.js";
import * as exportImportController from "../controllers/exportImportController.js";

// Configure Multer (Memory Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});
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

// Download CSV template
router.get("/template/csv", exportImportController.downloadCSVTemplate);

// Database backup
router.get("/backup/database", exportImportController.backupDatabase);

export default router;
