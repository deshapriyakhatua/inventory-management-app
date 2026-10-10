import { calculatePaymentStatus } from "@/lib/paymentStatus";
import { formatDateGB } from "./allInvoicesUtils";
import { createInvoicesWorkbook } from "./allInvoicesWorkbook";

// Pure sheet-data builder for the all-invoices Excel export (Summary, Grouped, Raw Data).
// Moved verbatim from page.js; the page handler still writes the file and shows the toasts.
export function buildInvoicesWorkbook(invoices, showArchived) {
  // ── Calculate Summary Statistics ────────────────────────────────
  let totalInvoices = invoices.length;
  let totalRevenue = 0;
  let totalReceived = 0;
  let totalBalance = 0;
  let paidCount = 0;
  let partialCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;

  // Buyer Summary breakdown map
  const buyerSummaryMap = {};

  invoices.forEach((inv) => {
    const gTotal = Number(inv.grandTotal) || 0;
    const rAmount = Number(inv.receivedAmount) || 0;
    const bAmount =
      inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
        ? inv.balanceAmount
        : gTotal - rAmount;

    totalRevenue += gTotal;
    totalReceived += rAmount;
    totalBalance += bAmount;

    const st = inv.paymentStatus || calculatePaymentStatus(gTotal, rAmount);
    if (st === "Paid") paidCount++;
    else if (st === "Partially Paid") partialCount++;
    else if (st === "Cancelled") cancelledCount++;
    else pendingCount++;

    const buyerName = inv.buyerDetails?.businessName || "Unknown Customer";
    const gstin = inv.buyerDetails?.gstNo || inv.buyerDetails?.gstin || inv.buyerDetails?.gstNumber || "NA";
    const state = inv.buyerDetails?.state || inv.placeOfSupply || "NA";

    if (!buyerSummaryMap[buyerName]) {
      buyerSummaryMap[buyerName] = {
        buyerName,
        gstin,
        state,
        invoiceCount: 0,
        totalRevenue: 0,
        totalReceived: 0,
        totalBalance: 0,
      };
    }
    const b = buyerSummaryMap[buyerName];
    if (b.gstin === "NA" && gstin !== "NA") b.gstin = gstin;
    if (b.state === "NA" && state !== "NA") b.state = state;

    b.invoiceCount += 1;
    b.totalRevenue += gTotal;
    b.totalReceived += rAmount;
    b.totalBalance += bAmount;
  });

  // ── 1. SHEET 1: SUMMARY ─────────────────────────────────────────
  const summaryData = [
    ["B2B INVOICES EXECUTIVE SUMMARY REPORT"],
    [`Generated On: ${new Date().toLocaleString("en-IN")}`],
    [`Scope: ${showArchived ? "Archived Invoices" : "Active Invoices"}`],
    [],
    ["EXECUTIVE KPI METRICS"],
    ["Metric", "Value"],
    ["Total Invoices Count", totalInvoices],
    ["Total Invoiced Revenue (₹)", Number(totalRevenue.toFixed(2))],
    ["Total Amount Received (₹)", Number(totalReceived.toFixed(2))],
    ["Outstanding Balance Due (₹)", Number(totalBalance.toFixed(2))],
    ["Paid Invoices", paidCount],
    ["Partially Paid Invoices", partialCount],
    ["Pending Invoices", pendingCount],
    ["Cancelled Invoices", cancelledCount],
    [],
    ["CUSTOMER / BUYER SALES BREAKDOWN"],
    ["Customer / Buyer Name", "GSTIN", "Customer State", "Invoices Count", "Total Revenue (₹)", "Total Received (₹)", "Balance Due (₹)"]
  ];

  Object.values(buyerSummaryMap).forEach((b) => {
    summaryData.push([
      b.buyerName,
      b.gstin,
      b.state,
      b.invoiceCount,
      Number(b.totalRevenue.toFixed(2)),
      Number(b.totalReceived.toFixed(2)),
      Number(b.totalBalance.toFixed(2))
    ]);
  });

  // ── 2. SHEET 2: INVOICE & CUSTOMER GROUPED ──────────────────────
  const groupedData = [
    ["INVOICE & CUSTOMER GROUPED REPORT"],
    [`Generated On: ${new Date().toLocaleString("en-IN")}`],
    [],
    [
      "Record Type",
      "Invoice No",
      "Invoice Date",
      "Customer / Buyer Name",
      "Customer GSTIN",
      "Customer State",
      "Line Items / Inventory ID",
      "Description",
      "HSN Code",
      "Quantity",
      "Unit Price (₹)",
      "Tax Rate %",
      "Tax Amount (₹)",
      "Line / Invoice Total (₹)",
      "Received Amount (₹)",
      "Balance Due (₹)",
      "Payment Status"
    ]
  ];

  invoices.forEach((inv) => {
    const buyerName = inv.buyerDetails?.businessName || "Unknown Customer";
    const gstin = inv.buyerDetails?.gstNo || inv.buyerDetails?.gstin || inv.buyerDetails?.gstNumber || "NA";
    const state = inv.buyerDetails?.state || inv.placeOfSupply || "NA";
    const lineItemsCount = inv.lineItems?.length || 0;
    const gTotal = Number(inv.grandTotal) || 0;
    const rAmount = Number(inv.receivedAmount) || 0;
    const bAmount =
      inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
        ? inv.balanceAmount
        : gTotal - rAmount;

    // Group Header Row
    groupedData.push([
      "INVOICE HEADER",
      inv.invoiceNumber || "-",
      formatDateGB(inv.invoiceDate),
      buyerName,
      gstin,
      state,
      `${lineItemsCount} item(s)`,
      "-",
      "-",
      "-",
      "-",
      "-",
      Number((inv.totalTax || 0).toFixed(2)),
      Number(gTotal.toFixed(2)),
      Number(rAmount.toFixed(2)),
      Number(bAmount.toFixed(2)),
      inv.paymentStatus || calculatePaymentStatus(gTotal, rAmount)
    ]);

    // Sub-rows for each Line Item in the Invoice
    (inv.lineItems || []).forEach((item) => {
      groupedData.push([
        "Item Detail",
        inv.invoiceNumber || "-",
        formatDateGB(inv.invoiceDate),
        buyerName,
        gstin,
        state,
        item.inventoryId || "-",
        item.description || "-",
        item.hsnCode || "-",
        item.quantity || 0,
        Number((item.unitPrice || 0).toFixed(2)),
        `${item.taxRate || 0}%`,
        Number((item.taxAmount || 0).toFixed(2)),
        Number((item.totalAmount || 0).toFixed(2)),
        "-",
        "-",
        inv.paymentStatus || calculatePaymentStatus(gTotal, rAmount)
      ]);
    });

    groupedData.push([]); // Blank spacing row between invoices
  });

  // ── 3. SHEET 3: ALL INVOICE LINE ITEMS (RAW DATA FLAT LIST) ─────
  const flatData = [
    ["ALL INVOICE LINE ITEMS (RAW DATA)"],
    [`Generated On: ${new Date().toLocaleString("en-IN")}`],
    [],
    [
      "Invoice No",
      "Invoice Date",
      "Customer / Buyer Name",
      "Customer GSTIN",
      "Customer State",
      "Inventory ID",
      "Description",
      "HSN Code",
      "Quantity",
      "Unit Price (₹)",
      "Tax Rate %",
      "Tax Amount (₹)",
      "Line Total (₹)",
      "Invoice Grand Total (₹)",
      "Amount Received (₹)",
      "Balance Due (₹)",
      "Payment Status"
    ]
  ];

  invoices.forEach((inv) => {
    const buyerName = inv.buyerDetails?.businessName || "Unknown Customer";
    const gstin = inv.buyerDetails?.gstNo || inv.buyerDetails?.gstin || inv.buyerDetails?.gstNumber || "NA";
    const state = inv.buyerDetails?.state || inv.placeOfSupply || "NA";
    const gTotal = Number(inv.grandTotal) || 0;
    const rAmount = Number(inv.receivedAmount) || 0;
    const bAmount =
      inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
        ? inv.balanceAmount
        : gTotal - rAmount;
    const st = inv.paymentStatus || calculatePaymentStatus(gTotal, rAmount);

    (inv.lineItems || []).forEach((item) => {
      flatData.push([
        inv.invoiceNumber || "-",
        formatDateGB(inv.invoiceDate),
        buyerName,
        gstin,
        state,
        item.inventoryId || "-",
        item.description || "-",
        item.hsnCode || "-",
        item.quantity || 0,
        Number((item.unitPrice || 0).toFixed(2)),
        `${item.taxRate || 0}%`,
        Number((item.taxAmount || 0).toFixed(2)),
        Number((item.totalAmount || 0).toFixed(2)),
        Number(gTotal.toFixed(2)),
        Number(rAmount.toFixed(2)),
        Number(bAmount.toFixed(2)),
        st
      ]);
    });
  });

  return createInvoicesWorkbook(summaryData, groupedData, flatData);
}
