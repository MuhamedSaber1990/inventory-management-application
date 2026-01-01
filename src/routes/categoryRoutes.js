import { Router } from "express";
import { doubleCsrfProtection } from "../config/csrf.js";
import { requireAuth } from "../middleware/auth.js";
import {
  categoryRules,
  validateAddCategory,
  validateEditCategory,
} from "../middleware/categoryValidators.js";
import * as categoryController from "../controllers/categoryController.js";

const router = Router();

// All category routes require authentication
router.use(requireAuth);

// List all categories
router.get("/", categoryController.showCategories);

// Add new category
router.get("/add", categoryController.showAddCategoryForm);
router.post(
  "/new",
  doubleCsrfProtection,
  categoryRules,
  validateAddCategory,
  categoryController.addCategoryHandler
);

// Edit category
router.get("/edit/:id", categoryController.showEditCategoryForm);
router.post(
  "/edit/:id",
  doubleCsrfProtection,
  categoryRules,
  validateEditCategory,
  categoryController.editCategoryHandler
);

// Delete category
router.post(
  "/delete/:id",
  doubleCsrfProtection,
  categoryController.deleteCategoryHandler
);

export default router;
