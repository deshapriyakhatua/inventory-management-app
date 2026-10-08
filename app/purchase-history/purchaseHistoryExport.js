import * as XLSX from "xlsx";
import { calculateTotal, calculateFinalUnitPrice, formatDate } from "./purchaseHistoryUtils";

// Pure workbook builder for the purchase-history Excel export (Summary, Grouped, Flat List).
// Moved verbatim from page.js; the page handler still writes the file and shows the toasts.
export function buildPurchaseHistoryWorkbook(targetGroups, targetItems, showArchived) {
  // ── Calculate Summary Statistics ────────────────────────────────
  let totalInvoices = targetGroups.length;
  let totalItems = targetItems.length;
  let totalQty = 0;
  let totalCost = 0;
  let totalShipping = 0;
  let totalTax = 0;
  let deliveredInvoices = 0;
  let inTransitInvoices = 0;

  targetGroups.forEach(g => {
    totalQty += g.totalQuantity;
    totalCost += g.totalAmount;
    totalShipping += g.totalShipping;
    totalTax += g.totalTax;
    if (g.deliveredCount === g.items.length) deliveredInvoices++;
    else inTransitInvoices++;
  });

  // Seller Summary breakdown map
  const sellerSummaryMap = {};
  targetGroups.forEach(g => {
    if (!sellerSummaryMap[g.sellerName]) {
      sellerSummaryMap[g.sellerName] = {
        sellerName: g.sellerName,
        invoiceCount: 0,
        itemCount: 0,
        totalQty: 0,
        totalCost: 0
      };
    }
    const s = sellerSummaryMap[g.sellerName];
    s.invoiceCount += 1;
    s.itemCount += g.items.length;
    s.totalQty += g.totalQuantity;
    s.totalCost += g.totalAmount;
  });

  // ── 1. SHEET 1: SUMMARY ─────────────────────────────────────────
  const summaryData = [
    ["PURCHASE HISTORY EXECUTIVE SUMMARY REPORT"],
    [`Generated On: ${new Date().toLocaleString("en-IN")}`],
    [`Scope: ${showArchived ? "Archived Purchase Records" : "Active Purchase Records"}`],
    [],
    ["EXECUTIVE KPI METRICS"],
    ["Metric", "Value"],
    ["Total Invoices / Orders", totalInvoices],
    ["Total Line Items", totalItems],
    ["Total Purchased Units (Qty)", totalQty],
    ["Total Shipping Fees (₹)", Number(totalShipping.toFixed(2))],
    ["Total Tax Amount (₹)", Number(totalTax.toFixed(2))],
    ["Total Procurement Expense (₹)", Number(totalCost.toFixed(2))],
    ["Fully Delivered Invoices", deliveredInvoices],
    ["In-Transit / Partial Invoices", inTransitInvoices],
    [],
    ["SELLER PROCUREMENT BREAKDOWN"],
    ["Seller Name", "Invoices Count", "Items Count", "Total Units (Qty)", "Total Expense (₹)"]
  ];

  Object.values(sellerSummaryMap).forEach(s => {
    summaryData.push([
      s.sellerName,
      s.invoiceCount,
      s.itemCount,
      s.totalQty,
      Number(s.totalCost.toFixed(2))
    ]);
  });

  // ── 2. SHEET 2: INVOICE & SELLER GROUPED ────────────────────────
  const groupedData = [
    ["INVOICE & SELLER GROUPED PURCHASES"],
    [`Generated On: ${new Date().toLocaleString("en-IN")}`],
    [],
    [
      "Record Type",
      "Invoice No",
      "Seller Name",
      "Order Date",
      "Seller SKU / Item Count",
      "Internal Inventory ID",
      "Quantity",
      "Base Unit Price (₹)",
      "Final Unit Price (inc. Ship & Tax) (₹)",
      "Shipping Fee (₹)",
      "Tax %",
      "Tax Amount (₹)",
      "Total Cost (₹)",
      "Received On",
      "Status"
    ]
  ];

  targetGroups.forEach((group) => {
    // Group Header Row
    groupedData.push([
      "INVOICE GROUP",
      group.invoiceNo,
      group.sellerName,
      formatDate(group.orderedOn),
      `${group.itemCount} item(s)`,
      "-",
      group.totalQuantity,
      "-",
      "-",
      Number(group.totalShipping.toFixed(2)),
      "-",
      Number(group.totalTax.toFixed(2)),
      Number(group.totalAmount.toFixed(2)),
      "-",
      group.groupStatus
    ]);

    // Individual Item Detail Rows
    group.items.forEach((p) => {
      const itemTotal = calculateTotal(p);
      const finalUnitPrice = calculateFinalUnitPrice(p);
      const subtotal = (p.quantity || 0) * (p.price || 0);
      const taxAmount = (subtotal * (p.taxPercentage || 0)) / 100;

      groupedData.push([
        "Item Detail",
        group.invoiceNo,
        group.sellerName,
        formatDate(p.orderedOn),
        p.sellerProductId || "-",
        p.inventoryId || "-",
        p.quantity || 0,
        Number((p.price || 0).toFixed(2)),
        Number(finalUnitPrice.toFixed(2)),
        Number((p.shippingFee || 0).toFixed(2)),
        `${p.taxPercentage || 0}%`,
        Number(taxAmount.toFixed(2)),
        Number(itemTotal.toFixed(2)),
        formatDate(p.receivedOn),
        p.receivedOn ? "Delivered" : "In-Transit"
      ]);
    });

    groupedData.push([]); // Blank spacing row between groups
  });

  // ── 3. SHEET 3: RAW DATA (FLAT LIST) ───────────────────────────
  const flatData = [
    ["ALL PURCHASE RECORDS (RAW DATA)"],
    [`Generated On: ${new Date().toLocaleString("en-IN")}`],
    [],
    [
      "Date Ordered",
      "Invoice No",
      "Seller Name",
      "Seller SKU",
      "Internal Inventory ID",
      "Quantity",
      "Base Unit Price (₹)",
      "Final Unit Price (inc. Ship & Tax) (₹)",
      "Shipping Fee (₹)",
      "Tax %",
      "Tax Amount (₹)",
      "Total Cost (₹)",
      "Received On",
      "Status"
    ]
  ];

  targetItems.forEach((p) => {
    const itemTotal = calculateTotal(p);
    const finalUnitPrice = calculateFinalUnitPrice(p);
    const subtotal = (p.quantity || 0) * (p.price || 0);
    const taxAmount = (subtotal * (p.taxPercentage || 0)) / 100;
    const sellerName = p.sellerId?.businessName || "Unknown Seller";

    flatData.push([
      formatDate(p.orderedOn),
      p.invoiceNo || "-",
      sellerName,
      p.sellerProductId || "-",
      p.inventoryId || "-",
      p.quantity || 0,
      Number((p.price || 0).toFixed(2)),
      Number(finalUnitPrice.toFixed(2)),
      Number((p.shippingFee || 0).toFixed(2)),
      `${p.taxPercentage || 0}%`,
      Number(taxAmount.toFixed(2)),
      Number(itemTotal.toFixed(2)),
      formatDate(p.receivedOn),
      p.receivedOn ? "Delivered" : "In-Transit"
    ]);
  });

  // ── CREATE WORKBOOK AND APPEND ALL 3 WORKSHEETS ─────────────────
  const workbook = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [
    { wch: 32 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // 2. Invoice & Seller Grouped Sheet
  const groupedSheet = XLSX.utils.aoa_to_sheet(groupedData);
  groupedSheet["!cols"] = [
    { wch: 16 }, // Record Type
    { wch: 18 }, // Invoice No
    { wch: 22 }, // Seller Name
    { wch: 14 }, // Order Date
    { wch: 22 }, // Seller SKU / Item Count
    { wch: 22 }, // Internal Inventory ID
    { wch: 10 }, // Quantity
    { wch: 18 }, // Base Unit Price
    { wch: 28 }, // Final Unit Price
    { wch: 16 }, // Shipping Fee
    { wch: 10 }, // Tax %
    { wch: 14 }, // Tax Amount
    { wch: 18 }, // Total Cost
    { wch: 14 }, // Received On
    { wch: 14 }  // Status
  ];
  XLSX.utils.book_append_sheet(workbook, groupedSheet, "Invoice & Seller Grouped");

  // 3. Raw Data Flat List Sheet
  const flatSheet = XLSX.utils.aoa_to_sheet(flatData);
  flatSheet["!cols"] = [
    { wch: 14 }, // Date Ordered
    { wch: 18 }, // Invoice No
    { wch: 22 }, // Seller Name
    { wch: 20 }, // Seller SKU
    { wch: 20 }, // Internal Inventory ID
    { wch: 10 }, // Quantity
    { wch: 18 }, // Base Unit Price
    { wch: 28 }, // Final Unit Price
    { wch: 16 }, // Shipping Fee
    { wch: 10 }, // Tax %
    { wch: 14 }, // Tax Amount
    { wch: 18 }, // Total Cost
    { wch: 14 }, // Received On
    { wch: 14 }  // Status
  ];
  XLSX.utils.book_append_sheet(workbook, flatSheet, "All Purchase Records");

  return workbook;
}
