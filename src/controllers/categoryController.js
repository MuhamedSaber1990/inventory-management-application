import { generateCsrfToken } from "../config/csrf.js";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  countProductsInCategory,
  categoryNameExists,
} from "../models/categoryModel.js";

// Show all categories
export async function showCategories(req, res) {
  const csrfToken = generateCsrfToken(req, res);

  try {
    const categories = await getAllCategories();

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        product_count: await countProductsInCategory(category.id),
      }))
    );

    res.render("categories.ejs", {
      categories: categoriesWithCount,
      csrfToken,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error fetching categories");
  }
}

// Show add category form
export function showAddCategoryForm(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  res.render("addcategory.ejs", {
    errorMessage: null,
    old: {},
    csrfToken,
  });
}

// Handle add category
export async function addCategoryHandler(req, res) {
  const { name, description } = req.body;
  const csrfToken = generateCsrfToken(req, res);

  try {
    // Check if category name already exists
    const exists = await categoryNameExists(name);
    if (exists) {
      return res.status(400).render("addcategory.ejs", {
        errorMessage: "A category with this name already exists",
        old: { name, description },
        csrfToken,
      });
    }

    await createCategory(name, description);
    res.redirect("/categories");
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).render("addcategory.ejs", {
      errorMessage: "Error creating category",
      old: { name, description },
      csrfToken,
    });
  }
}

// Show edit category form
export async function showEditCategoryForm(req, res) {
  const { id } = req.params;
  const csrfToken = generateCsrfToken(req, res);

  try {
    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Check if it's "Uncategorized" (prevent editing)
    if (category.name === "Uncategorized") {
      return res.status(403).render("error.ejs", {
        title: "Cannot Edit",
        message: "The 'Uncategorized' category cannot be edited.",
        status: 403,
      });
    }

    res.render("editcategory.ejs", {
      category,
      errorMessage: null,
      csrfToken,
    });
  } catch (error) {
    console.error("Error loading category:", error);
    res.status(500).send("Error loading category");
  }
}

// Handle edit category
export async function editCategoryHandler(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;
  const csrfToken = generateCsrfToken(req, res);

  try {
    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Prevent editing "Uncategorized"
    if (category.name === "Uncategorized") {
      return res.status(403).send("Cannot edit Uncategorized category");
    }

    // Check if new name already exists (excluding current category)
    const exists = await categoryNameExists(name, id);
    if (exists) {
      return res.status(400).render("editcategory.ejs", {
        category: { id, name, description },
        errorMessage: "A category with this name already exists",
        csrfToken,
      });
    }

    await updateCategory(id, name, description);
    res.redirect("/categories");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).render("editcategory.ejs", {
      category: { id, name, description },
      errorMessage: "Error updating category",
      csrfToken,
    });
  }
}

// Handle delete category
export async function deleteCategoryHandler(req, res) {
  const { id } = req.params;

  try {
    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Prevent deleting "Uncategorized"
    if (category.name === "Uncategorized") {
      return res.status(403).render("error.ejs", {
        title: "Cannot Delete",
        message: "The 'Uncategorized' category cannot be deleted.",
        status: 403,
      });
    }

    await deleteCategory(id);
    res.redirect("/categories");
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("Error deleting category");
  }
}
