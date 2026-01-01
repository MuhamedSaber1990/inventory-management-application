import { Parser } from "json2csv";
import { getAllProductsForExport } from "../models/productModel.js";

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
