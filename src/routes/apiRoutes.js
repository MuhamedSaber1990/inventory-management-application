import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as aiController from "../controllers/aiController.js";

const router = Router();

// Protect all API routes
router.use(requireAuth);

// Generate Description Endpoint
router.post("/generate-description", aiController.generateProductDescription);

export default router;
