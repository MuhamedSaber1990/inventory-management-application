import { Parser } from "json2csv";
import Papa from "papaparse";
import {
  getAllProductsForExport,
  importProductsBulk,
  getCategories,
} from "../models/productModel.js";
import { randomBarCode, SKU } from "../utils/helpers.js";
import { generateCsrfToken } from "../config/csrf.js";

export async function exportProductsCSV(req, res) {
  try {
    const products = await getAllProductsForExport();

    const fields = [
      { label: "ID", value: "id" },
      { label: "Name", value: "name" },
      { label: "SKU", value: "sku" },
      { label: "Barcode", value: "bar_code" },
      { label: "Price", value: "price" },
      { label: "Quantity", value: "quantity" },
      { label: "Description", value: "description" },
      { label: "Category", value: "category_name" },
      { label: "Created At", value: "created_at" },
      { label: "Updated At", value: "updated_at" },
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products);

    const timestamp = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=products_${timestamp}.csv`
    );

    res.send(csv);
  } catch (error) {
    console.error("CSV Export Error:", error);
    res.status(500).send("Error exporting products to CSV");
  }
}

export async function showImportPage(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  const categories = await getCategories();
  res.render("import.ejs", {
    errorMessage: null,
    successMessage: null,
    categories,
    csrfToken,
  });
}

export async function importProductsCSV(req, res) {
  const csrfToken = generateCsrfToken(req, res);
  const categories = await getCategories();

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).render("import.ejs", {
        errorMessage: "Please upload a CSV file",
        successMessage: null,
        categories,
        csrfToken,
      });
    }

    // Parse CSV file
    const fileContent = req.file.buffer.toString("utf-8");
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parseResult.errors.length > 0) {
      return res.status(400).render("import.ejs", {
        errorMessage: `CSV parsing error: ${parseResult.errors[0].message}`,
        successMessage: null,
        categories,
        csrfToken,
      });
    }

    const rows = parseResult.data;

    if (rows.length === 0) {
      return res.status(400).render("import.ejs", {
        errorMessage: "CSV file is empty",
        successMessage: null,
        categories,
        csrfToken,
      });
    }

    // Validate and prepare data
    const productsToImport = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because index starts at 0 and header is row 1

      // Validate required fields
      if (!row.Name || !row.Price || row.Quantity === undefined) {
        errors.push(
          `Row ${rowNum}: Missing required fields (Name, Price, Quantity)`
        );
        continue;
      }

      // Find category ID by name
      let categoryId = null;
      if (row.Category) {
        const category = categories.find(
          (c) => c.name.toLowerCase() === row.Category.toLowerCase()
        );
        categoryId = category ? category.id : null;
      }

      // If no category or invalid, use Uncategorized
      if (!categoryId) {
        const uncategorized = categories.find(
          (c) => c.name === "Uncategorized"
        );
        categoryId = uncategorized ? uncategorized.id : null;
      }

      productsToImport.push({
        name: row.Name.trim(),
        sku: row.SKU || SKU(row.Name),
        bar_code: row.Barcode || randomBarCode(),
        price: parseFloat(row.Price),
        quantity: parseInt(row.Quantity, 10),
        description: row.Description || "Imported product",
        category_id: categoryId,
      });
    }

    if (errors.length > 0 && productsToImport.length === 0) {
      return res.status(400).render("import.ejs", {
        errorMessage: `Import failed: ${errors.join(", ")}`,
        successMessage: null,
        categories,
        csrfToken,
      });
    }

    // Import products
    const result = await importProductsBulk(productsToImport);

    const message =
      errors.length > 0
        ? `Imported ${result.count} products. Warnings: ${errors.join(", ")}`
        : `Successfully imported ${result.count} products!`;

    res.render("import.ejs", {
      errorMessage: null,
      successMessage: message,
      categories,
      csrfToken,
    });
  } catch (error) {
    console.error("Import Error:", error);

    // Handle duplicate key errors
    if (error.code === "23505") {
      return res.status(400).render("import.ejs", {
        errorMessage: "Duplicate SKU or Barcode found in import file",
        successMessage: null,
        categories,
        csrfToken,
      });
    }

    res.status(500).render("import.ejs", {
      errorMessage: "Error importing products: " + error.message,
      successMessage: null,
      categories,
      csrfToken,
    });
  }
}

export function downloadCSVTemplate(req, res) {
  const template = `Name,SKU,Barcode,Price,Quantity,Description,Category
Wireless Mouse,WM-001,1234567890123,29.99,50,Ergonomic wireless mouse with USB receiver,Electronics
Office Chair,OC-002,9876543210987,199.99,20,Adjustable office chair with lumbar support,Furniture
USB Cable,UC-003,5555555555555,9.99,100,USB-C to USB-A cable 2m,Accessories`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=products_template.csv"
  );
  res.send(template);
}
