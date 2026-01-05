// Product routes: CRUD actions for products (mounted under `/products`)
import { Router } from "express";
import { doubleCsrfProtection } from "../config/csrf.js";
import {
  validateAddProducts,
  validateUpdateProducts,
  productRules,
} from "../middleware/productValidators.js";
import * as productController from "../controllers/productController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All product routes require authentication
router.use(requireAuth);

// Note: this router is mounted at `/products` in the main router
router.get("/", productController.showProducts);
router.get("/add", productController.showAddProductForm);
router.post(
  "/new",
  doubleCsrfProtection,
  productRules,
  validateAddProducts,
  productController.addProductHandler
);

router.get("/edit/:id", productController.updateProductsFrom);

router.post(
  "/edit/:id",
  doubleCsrfProtection,
  productRules,
  validateUpdateProducts,
  productController.updateProductHandler
);
router.post(
  "/delete/:id",
  doubleCsrfProtection,
  productController.deleteProductHandler
);

export default router;
