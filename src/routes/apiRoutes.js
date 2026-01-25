import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as aiController from "../controllers/aiController.js";

const router = Router();

// Protect all API routes
router.use(requireAuth);

// Generate Description Endpoint
router.post("/generate-description", aiController.generateProductDescription);

// Natural Language Search
router.post("/search-natural", aiController.naturalLanguageSearch);

// AI Dashboard Insights
router.post("/dashboard-insights", aiController.generateDashboardInsights);

//AI Suggest Category
router.post("/suggest-category", aiController.suggestCategory);

export default router;
