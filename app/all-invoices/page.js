"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { downloadInvoicePdf } from "@/utils/generatePdf";
import { calculatePaymentStatus } from "@/lib/paymentStatus";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import PaymentQrModal from "@/components/PaymentQrModal/PaymentQrModal";
import { formatDateGB } from "./allInvoicesUtils";
import EditInvoiceModal from "./_components/EditInvoiceModal/EditInvoiceModal";
import GraphicalViewModal from "./_components/GraphicalViewModal/GraphicalViewModal";
import InvoiceMetrics from "./_components/InvoiceMetrics/InvoiceMetrics";
import InvoicesControlBar from "./_components/InvoicesControlBar/InvoicesControlBar";
import InvoicesHeader from "./_components/InvoicesHeader/InvoicesHeader";
import InvoicesTable from "./_components/InvoicesTable/InvoicesTable";
import PdfPreviewModal from "./_components/PdfPreviewModal/PdfPreviewModal";

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showArchived, setShowArchived] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // View / Print PDF Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const pdfPreviewRef = useRef(null);

  // Graphical View Modal State & Inventory List
  const [inventoryList, setInventoryList] = useState([]);
  const [showGraphicalModal, setShowGraphicalModal] = useState(false);
  const [graphicalModalInvoice, setGraphicalModalInvoice] = useState(null);

  // Payment QR Modal State
  const [showPaymentQrModal, setShowPaymentQrModal] = useState(false);
  const [paymentQrInvoice, setPaymentQrInvoice] = useState(null);

  // 3-Dot Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-action-menu]")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchInventoryList = async () => {
    try {
      const res = await fetch("/api/employee/inventory");
      const data = await res.json();
      if (res.ok && data.data) {
        setInventoryList(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory list:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchInventoryList();
  }, [search, statusFilter, showArchived]);

  const handleOpenGraphicalModal = (inv) => {
    setGraphicalModalInvoice(inv);
    setShowGraphicalModal(true);
  };

  const handleOpenPaymentQr = (inv) => {
    setPaymentQrInvoice(inv);
    setShowPaymentQrModal(true);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/api/employee/b2b-invoice?archived=${showArchived}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter && statusFilter !== "All")
        url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.data) {
        setInvoices(data.data);
      } else {
        toast.error("Failed to load invoices");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    onConfirm: null,
    isLoading: false,
  });

  // Archive invoice (soft delete)
  const handleArchive = (id, invNum) => {
    setConfirmModal({
      isOpen: true,
      title: "Archive Invoice",
      message: `Archive invoice ${invNum || ""}? You can view or restore it anytime from Archived Invoices.`,
      confirmLabel: "Archive Invoice",
      variant: "warning",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/employee/b2b-invoice?id=${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Invoice archived successfully");
            fetchInvoices();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } else {
            toast.error(data.error || "Failed to archive invoice");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error archiving invoice");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Restore invoice (unarchive)
  const handleRestore = (id, invNum) => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Invoice",
      message: `Restore invoice ${invNum || ""} back to Active Invoices?`,
      confirmLabel: "Restore Invoice",
      variant: "info",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/employee/b2b-invoice`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: id, isArchived: false }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Invoice restored to active invoices!");
            fetchInvoices();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } else {
            toast.error(data.error || "Failed to restore invoice");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error restoring invoice");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Delete invoice permanently
  const handlePermanentDelete = (id, invNum) => {
    setConfirmModal({
      isOpen: true,
      title: "Permanently Delete Invoice",
      message: `Are you sure you want to PERMANENTLY delete invoice ${invNum || ""}? This action CANNOT be undone.`,
      confirmLabel: "Delete Permanently",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/employee/b2b-invoice?id=${id}&permanent=true`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Invoice permanently deleted");
            fetchInvoices();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } else {
            toast.error(data.error || "Failed to delete invoice");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error deleting invoice");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (inv) => {
    const copy = JSON.parse(JSON.stringify(inv));
    if (copy.invoiceDate) {
      copy.invoiceDate = new Date(copy.invoiceDate).toISOString().split("T")[0];
    }
    setEditingInvoice(copy);
    setShowEditModal(true);
  };

  // Edit Modal Item Handlers
  const handleEditLineItemChange = (index, field, value) => {
    if (!editingInvoice) return;
    const updatedItems = [...editingInvoice.lineItems];
    updatedItems[index][field] = value;

    // Recalculate row amounts
    const qty = Number(updatedItems[index].quantity) || 0;
    const price = Number(updatedItems[index].unitPrice) || 0;
    const gstRate = Number(updatedItems[index].taxRate) || 0;

    const amount = qty * price;
    const taxAmount = (amount * gstRate) / 100;
    const totalAmount = amount + taxAmount;

    updatedItems[index].amount = amount;
    updatedItems[index].taxAmount = taxAmount;
    updatedItems[index].totalAmount = totalAmount;

    setEditingInvoice({
      ...editingInvoice,
      lineItems: updatedItems,
    });
  };

  const addEditLineItem = () => {
    if (!editingInvoice) return;
    setEditingInvoice({
      ...editingInvoice,
      lineItems: [
        ...editingInvoice.lineItems,
        {
          inventoryId: "",
          description: "New Item",
          hsnCode: "7117",
          quantity: 1,
          unitPrice: 0,
          taxRate: 3,
          amount: 0,
          taxAmount: 0,
          totalAmount: 0,
        },
      ],
    });
  };

  const removeEditLineItem = (index) => {
    if (!editingInvoice || editingInvoice.lineItems.length === 1) {
      toast.error("Invoice must have at least one line item");
      return;
    }
    const updated = editingInvoice.lineItems.filter((_, i) => i !== index);
    setEditingInvoice({
      ...editingInvoice,
      lineItems: updated,
    });
  };

  // Save Edit Submission
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setIsSavingEdit(true);

    // Recalculate totals
    const subtotal = editingInvoice.lineItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalTax = editingInvoice.lineItems.reduce(
      (sum, item) => sum + (Number(item.taxAmount) || 0),
      0
    );
    const grandTotal =
      subtotal +
      totalTax +
      Number(editingInvoice.shippingFee || 0) -
      Number(editingInvoice.discount || 0);
    const balanceAmount =
      grandTotal - Number(editingInvoice.receivedAmount || 0);

    const paymentStatus =
      editingInvoice.paymentStatus === "Cancelled"
        ? "Cancelled"
        : calculatePaymentStatus(grandTotal, editingInvoice.receivedAmount);

    const payload = {
      ...editingInvoice,
      subtotal,
      totalTax,
      grandTotal,
      balanceAmount,
      paymentStatus,
    };

    try {
      const res = await fetch("/api/employee/b2b-invoice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Invoice updated successfully!");
        setShowEditModal(false);
        setEditingInvoice(null);
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to update invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while updating invoice");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open PDF View Modal
  const handleOpenPdf = (inv) => {
    setViewingInvoice(inv);
    setShowPdfModal(true);
  };

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    if (!pdfPreviewRef.current || !viewingInvoice) return;
    setIsDownloadingPdf(true);
    try {
      const fileName = `Invoice_${viewingInvoice.invoiceNumber}_${(
        viewingInvoice.buyerDetails?.businessName || "B2B"
      ).replace(/\s+/g, "_")}.pdf`;
      await downloadInvoicePdf(pdfPreviewRef.current, fileName);
      toast.success("PDF generated and downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // ── Multi-Sheet Excel Export (Summary, Grouped, Raw Data) ──────────
  const exportInvoicesToExcel = () => {
    if (!invoices || invoices.length === 0) {
      toast.error("No invoices available to export.");
      return;
    }

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

    // Write file
    const fileName = `All_Invoices_Report_${showArchived ? "Archived_" : ""}${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success(`Successfully downloaded Excel report: ${fileName}`);
  };

  // Metrics Calculations
  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.grandTotal || 0),
    0
  );
  const totalReceived = invoices.reduce(
    (sum, inv) => sum + (inv.receivedAmount || 0),
    0
  );
  const totalBalance = invoices.reduce(
    (sum, inv) => {
      const invBal =
        inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
          ? inv.balanceAmount
          : (inv.grandTotal || 0) - (inv.receivedAmount || 0);
      return sum + invBal;
    },
    0
  );

  // Edit Modal Auto Calculations
  const modalSubtotal =
    editingInvoice?.lineItems?.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    ) || 0;

  const modalTotalTax =
    editingInvoice?.lineItems?.reduce(
      (sum, item) => sum + (Number(item.taxAmount) || 0),
      0
    ) || 0;

  const modalGrandTotal =
    modalSubtotal +
    modalTotalTax +
    Number(editingInvoice?.shippingFee || 0) -
    Number(editingInvoice?.discount || 0);

  const modalReceived = Number(editingInvoice?.receivedAmount || 0);

  const modalAutoStatus = calculatePaymentStatus(modalGrandTotal, modalReceived);

  useEffect(() => {
    if (editingInvoice && editingInvoice.paymentStatus !== "Cancelled") {
      const autoSt = calculatePaymentStatus(modalGrandTotal, modalReceived);
      if (editingInvoice.paymentStatus !== autoSt) {
        setEditingInvoice((prev) => (prev ? { ...prev, paymentStatus: autoSt } : null));
      }
    }
  }, [modalGrandTotal, modalReceived, editingInvoice?.paymentStatus]);

  // ── JSX handlers (moved from inline arrows, identical bodies) ──────
  const handleToggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };
  const handleMenuGraphical = (inv) => { setOpenMenuId(null); handleOpenGraphicalModal(inv); };
  const handleMenuPdf = (inv) => { setOpenMenuId(null); handleOpenPdf(inv); };
  const handleMenuPaymentQr = (inv) => { setOpenMenuId(null); handleOpenPaymentQr(inv); };
  const handleMenuEdit = (inv) => { setOpenMenuId(null); handleOpenEdit(inv); };
  const handleMenuArchive = (inv) => { setOpenMenuId(null); handleArchive(inv._id, inv.invoiceNumber); };
  const handleMenuRestore = (inv) => { setOpenMenuId(null); handleRestore(inv._id, inv.invoiceNumber); };
  const handleMenuPermanentDelete = (inv) => { setOpenMenuId(null); handlePermanentDelete(inv._id, inv.invoiceNumber); };
  const handleShowActive = () => setShowArchived(false);
  const handleShowArchived = () => setShowArchived(true);
  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleCloseEditModal = () => setShowEditModal(false);
  const handleClosePdfModal = () => setShowPdfModal(false);
  const handleShowQrCodeChange = (e) => setShowQrCode(e.target.checked);
  const handleCloseGraphicalModal = () => setShowGraphicalModal(false);

  // Edit modal field handlers
  const handleEditInvoiceNumberChange = (e) =>
    setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value.toUpperCase() });
  const handleEditInvoiceDateChange = (e) =>
    setEditingInvoice({ ...editingInvoice, invoiceDate: e.target.value });
  const handleEditPlaceOfSupplyChange = (e) =>
    setEditingInvoice({ ...editingInvoice, placeOfSupply: e.target.value });
  const handleEditPaymentStatusChange = (e) => {
    const val = e.target.value;
    if (val === "Cancelled") {
      setEditingInvoice({
        ...editingInvoice,
        paymentStatus: "Cancelled",
      });
    } else {
      setEditingInvoice({
        ...editingInvoice,
        paymentStatus: calculatePaymentStatus(modalGrandTotal, modalReceived),
      });
    }
  };
  // Shared by the five buyer inputs (businessName, phoneNo, gstNo, address, state)
  const handleEditBuyerFieldChange = (field, value) =>
    setEditingInvoice({
      ...editingInvoice,
      buyerDetails: {
        ...editingInvoice.buyerDetails,
        [field]: value,
      },
    });
  const handleEditUpiIdChange = (e) =>
    setEditingInvoice({
      ...editingInvoice,
      sellerDetails: {
        ...editingInvoice.sellerDetails,
        upiId: e.target.value,
      },
    });
  const handleEditShippingFeeChange = (e) =>
    setEditingInvoice({ ...editingInvoice, shippingFee: Number(e.target.value) });
  const handleEditDiscountChange = (e) =>
    setEditingInvoice({ ...editingInvoice, discount: Number(e.target.value) });
  const handleEditReceivedAmountChange = (e) =>
    setEditingInvoice({ ...editingInvoice, receivedAmount: Number(e.target.value) });

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <InvoicesHeader onExport={exportInvoicesToExcel} />

      {/* Summary Metrics */}
      <InvoiceMetrics
        invoiceCount={invoices.length}
        totalRevenue={totalRevenue}
        totalReceived={totalReceived}
        totalBalance={totalBalance}
      />

      {/* Control Bar: Tabs, Search & Status Filter */}
      <InvoicesControlBar
        showArchived={showArchived}
        onShowActive={handleShowActive}
        onShowArchived={handleShowArchived}
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onRefresh={fetchInvoices}
        loading={loading}
      />

      {/* Main Invoices Table */}
      <InvoicesTable
        invoices={invoices}
        loading={loading}
        showArchived={showArchived}
        openMenuId={openMenuId}
        menuHandlers={{
          onToggle: handleToggleMenu,
          onGraphical: handleMenuGraphical,
          onPdf: handleMenuPdf,
          onPaymentQr: handleMenuPaymentQr,
          onEdit: handleMenuEdit,
          onArchive: handleMenuArchive,
          onRestore: handleMenuRestore,
          onPermanentDelete: handleMenuPermanentDelete,
        }}
      />

      {/* EDIT INVOICE MODAL */}
      {showEditModal && editingInvoice && (
        <EditInvoiceModal
          editingInvoice={editingInvoice}
          modalAutoStatus={modalAutoStatus}
          isSavingEdit={isSavingEdit}
          fieldHandlers={{
            onInvoiceNumberChange: handleEditInvoiceNumberChange,
            onInvoiceDateChange: handleEditInvoiceDateChange,
            onPlaceOfSupplyChange: handleEditPlaceOfSupplyChange,
            onPaymentStatusChange: handleEditPaymentStatusChange,
            onBuyerFieldChange: handleEditBuyerFieldChange,
            onUpiIdChange: handleEditUpiIdChange,
            onShippingFeeChange: handleEditShippingFeeChange,
            onDiscountChange: handleEditDiscountChange,
            onReceivedAmountChange: handleEditReceivedAmountChange,
          }}
          onLineItemChange={handleEditLineItemChange}
          onRemoveLineItem={removeEditLineItem}
          onAddLineItem={addEditLineItem}
          onClose={handleCloseEditModal}
          onSubmit={handleSaveEdit}
        />
      )}

      {/* VIEW PDF / PRINT MODAL (wraps InvoicePdfPreview; pdfPreviewRef feeds downloadInvoicePdf) */}
      {showPdfModal && viewingInvoice && (
        <PdfPreviewModal
          viewingInvoice={viewingInvoice}
          pdfPreviewRef={pdfPreviewRef}
          showQrCode={showQrCode}
          onShowQrCodeChange={handleShowQrCodeChange}
          isDownloadingPdf={isDownloadingPdf}
          onDownloadPdf={handleDownloadPdf}
          onClose={handleClosePdfModal}
        />
      )}

      {/* Graphical View Modal (Invoice Details & Inventory Images) */}
      {showGraphicalModal && graphicalModalInvoice && (
        <GraphicalViewModal
          graphicalModalInvoice={graphicalModalInvoice}
          inventoryList={inventoryList}
          onClose={handleCloseGraphicalModal}
        />
      )}

      {/* Payment QR Generator Modal */}
      <PaymentQrModal
        isOpen={showPaymentQrModal}
        onClose={() => setShowPaymentQrModal(false)}
        invoice={paymentQrInvoice}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
