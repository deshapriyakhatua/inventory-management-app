import * as XLSX from "xlsx";

// Assembles the three export sheets with their column widths. Moved verbatim from page.js.
export function createInvoicesWorkbook(summaryData, groupedData, flatData) {
  // ── CREATE WORKBOOK & APPEND ALL 3 WORKSHEETS ────────────────────
  const workbook = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [
    { wch: 28 }, // Customer Name
    { wch: 20 }, // GSTIN
    { wch: 20 }, // Customer State
    { wch: 14 }, // Invoices Count
    { wch: 20 }, // Total Revenue
    { wch: 20 }, // Total Received
    { wch: 20 }  // Balance Due
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // 2. Invoice & Customer Grouped Sheet
  const groupedSheet = XLSX.utils.aoa_to_sheet(groupedData);
  groupedSheet["!cols"] = [
    { wch: 16 }, // Record Type
    { wch: 18 }, // Invoice No
    { wch: 14 }, // Invoice Date
    { wch: 24 }, // Customer Name
    { wch: 20 }, // Customer GSTIN
    { wch: 20 }, // Customer State
    { wch: 22 }, // Line Items / Inventory ID
    { wch: 24 }, // Description
    { wch: 12 }, // HSN Code
    { wch: 10 }, // Quantity
    { wch: 16 }, // Unit Price
    { wch: 12 }, // Tax Rate %
    { wch: 14 }, // Tax Amount
    { wch: 20 }, // Line / Invoice Total
    { wch: 18 }, // Received Amount
    { wch: 16 }, // Balance Due
    { wch: 16 }  // Payment Status
  ];
  XLSX.utils.book_append_sheet(workbook, groupedSheet, "Invoice & Customer Grouped");

  // 3. All Invoice Line Items Sheet (Flat List)
  const flatSheet = XLSX.utils.aoa_to_sheet(flatData);
  flatSheet["!cols"] = [
    { wch: 18 }, // Invoice No
    { wch: 14 }, // Invoice Date
    { wch: 24 }, // Customer Name
    { wch: 20 }, // Customer GSTIN
    { wch: 20 }, // Customer State
    { wch: 22 }, // Inventory ID
    { wch: 24 }, // Description
    { wch: 12 }, // HSN Code
    { wch: 10 }, // Quantity
    { wch: 16 }, // Unit Price
    { wch: 12 }, // Tax Rate %
    { wch: 14 }, // Tax Amount
    { wch: 18 }, // Line Total
    { wch: 20 }, // Invoice Grand Total
    { wch: 18 }, // Amount Received
    { wch: 16 }, // Balance Due
    { wch: 16 }  // Payment Status
  ];
  XLSX.utils.book_append_sheet(workbook, flatSheet, "All Invoice Line Items");

  return workbook;
}
