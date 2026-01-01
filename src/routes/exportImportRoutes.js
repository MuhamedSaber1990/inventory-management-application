import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as exportController from "../controllers/exportImportController.js";

const router = Router();

// Protect routes
router.use(requireAuth);

// Export Routes
router.get("/export/products/csv", exportController.exportProductsCSV);

export default router;
