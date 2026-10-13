"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import RefreshIcon from "@/components/RefreshIcon/RefreshIcon";
import { GST_STATES } from "@/utils/gstStates";
import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import { downloadInvoicePdf } from "@/utils/generatePdf";
import { calculatePaymentStatus } from "@/lib/paymentStatus";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import PaymentQrModal from "@/components/PaymentQrModal/PaymentQrModal";

function formatDateGB(dateStr) {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }
  return new Date(dateStr).toLocaleDateString("en-GB");
}

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showArchived, setShowArchived] = useState(false);

  // Grouping State: "none" | "customer" | "state"
  const [groupBy, setGroupBy] = useState("none");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Sorting State
  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [sortByOption, setSortByOption] = useState("date_desc");

  // Filtering State
  const [customerFilter, setCustomerFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [dateFilterPreset, setDateFilterPreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Edit Modal Inventory Picker & Multi-Select State
  const [inventoryPickerIndex, setInventoryPickerIndex] = useState(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const pickerSearchRef = useRef(null);

  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const [selectedInvIds, setSelectedInvIds] = useState([]);
  const [multiSelectSearch, setMultiSelectSearch] = useState("");
  const multiSearchRef = useRef(null);

  // Floating Cursor Image Preview State
  const [hoveredImage, setHoveredImage] = useState(null);

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

  // GST Sales Report Modal State (Monthly basis)
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstMonth, setGstMonth] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}`;
  });
  const [gstIncludeArchived, setGstIncludeArchived] = useState(false);
  const [gstInvoices, setGstInvoices] = useState([]);
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [isExportingGst, setIsExportingGst] = useState(false);

  useEffect(() => {
    if (!showGstModal) return;
    const fetchMonthlyInvoices = async () => {
      setIsFetchingGst(true);
      try {
        const res = await fetch(
          `/api/employee/b2b-invoice?month=${gstMonth}&status=Paid&archived=${gstIncludeArchived}&limit=all`
        );
        const data = await res.json();
        if (res.ok && data.data) {
          const paidOnly = (data.data || []).filter((inv) => inv.paymentStatus === "Paid");
          setGstInvoices(paidOnly);
        } else {
          setGstInvoices([]);
        }
      } catch (err) {
        console.error("Error fetching GST invoices:", err);
        setGstInvoices([]);
      } finally {
        setIsFetchingGst(false);
      }
    };
    fetchMonthlyInvoices();
  }, [showGstModal, gstMonth, gstIncludeArchived]);

  const gstMonthStats = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalInvoiceAmount = 0;
    let totalRows = 0;

    gstInvoices.forEach((inv) => {
      const sellerGst = inv.sellerDetails?.gstNo?.slice(0, 2) || "19";
      const buyerGstin =
        inv.buyerDetails?.gstNo &&
        inv.buyerDetails.gstNo !== "NA" &&
        inv.buyerDetails.gstNo !== "N/A"
          ? inv.buyerDetails.gstNo.trim().toUpperCase()
          : "";
      const pos = inv.placeOfSupply || inv.buyerDetails?.state || "West Bengal";
      const buyerStateCode =
        buyerGstin.length >= 2
          ? buyerGstin.slice(0, 2)
          : pos.includes("-")
          ? pos.split("-")[0].trim()
          : "";
      const isInterState =
        buyerStateCode && buyerStateCode !== sellerGst
          ? true
          : !pos.toLowerCase().includes("west bengal") && !pos.startsWith("19");

      // Items
      (inv.lineItems || []).forEach((item) => {
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.taxRate !== undefined ? item.taxRate : item.gstRate) || 3;
        const taxable = Number(
          (item.amount !== undefined ? item.amount : qty * Number(item.unitPrice || 0)).toFixed(2)
        );
        const tax = Number(
          (item.taxAmount !== undefined ? item.taxAmount : (taxable * rate) / 100).toFixed(2)
        );
        const igst = isInterState ? tax : 0;
        const cgst = isInterState ? 0 : Number((tax / 2).toFixed(2));
        const sgst = isInterState ? 0 : Number((tax - cgst).toFixed(2));

        totalTaxable += taxable;
        totalCgst += cgst;
        totalSgst += sgst;
        totalIgst += igst;
        totalInvoiceAmount += Number((taxable + tax).toFixed(2));
        totalRows += 1;
      });

      // Shipping as part of Composite Supply
      const ship = Number(inv.shippingFee) || 0;
      if (ship > 0) {
        const shipTax = Number(((ship * 3) / 100).toFixed(2));
        const igst = isInterState ? shipTax : 0;
        const cgst = isInterState ? 0 : Number((shipTax / 2).toFixed(2));
        const sgst = isInterState ? 0 : Number((shipTax - cgst).toFixed(2));

        totalTaxable += ship;
        totalCgst += cgst;
        totalSgst += sgst;
        totalIgst += igst;
        totalInvoiceAmount += Number((ship + shipTax).toFixed(2));
        totalRows += 1;
      }
    });

    return {
      invoiceCount: gstInvoices.length,
      rowCount: totalRows,
      taxable: totalTaxable,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalGst: totalCgst + totalSgst + totalIgst,
      totalAmount: totalInvoiceAmount,
    };
  }, [gstInvoices]);

  const handleExportGstReport = () => {
    const paidInvoices = (gstInvoices || []).filter((inv) => inv.paymentStatus === "Paid");
    if (!paidInvoices || paidInvoices.length === 0) {
      toast.error("No paid invoices found for the selected month to export.");
      return;
    }

    setIsExportingGst(true);

    try {
      const headers = [
        "Date",
        "Invoice Number",
        "GSTIN",
        "Place of Supply",
        "Pincode",
        "Taxable Amount",
        "Quantity",
        "GST Rate",
        "IGST",
        "SGST/UTGST",
        "CGST",
        "CESS Rate",
        "CESS",
        "Invoice Amount",
        "HSN/SAC",
        "e-commerce GSTIN",
      ];

      const instructions = [
        "Enter date in dd-mm-yyyy format only.",
        "Invoice number should be of maximum 16 characters",
        "Customer GST number if available",
        "Compulsory if GSTIN is not entered.",
        "Enter customer address pincode ",
        "Enter pre GST value.",
        "Number of item sell ",
        "GST Rate without %",
        "Enter IGST amount",
        "Enter SGST amounr",
        "Enter CGST amount",
        "CESS Rate without %",
        "Enter CESS amount",
        "Enter total invoice amount (after GST)",
        "HSN/SAC is manadatory for persons with turnover of more than 2 crore.",
        "Enter eCommerce GST (TCS) for table 14 generation. (optional)",
      ];

      const salesRows = [headers, instructions];

      paidInvoices.forEach((inv) => {
        // Date formatted as dd-mm-yyyy
        let formattedDate = "";
        if (inv.invoiceDate) {
          const d = new Date(inv.invoiceDate);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, "0");
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const y = d.getFullYear();
            formattedDate = `${day}-${m}-${y}`;
          }
        }

        const invoiceNum = String(inv.invoiceNumber || "").slice(0, 16);

        // GSTIN
        const gstinRaw = inv.buyerDetails?.gstNo;
        const gstin =
          gstinRaw && gstinRaw !== "NA" && gstinRaw !== "N/A"
            ? String(gstinRaw).trim().toUpperCase()
            : "";

        // Place of supply (clean state name)
        let rawPos = inv.placeOfSupply || inv.buyerDetails?.state || "West Bengal";
        let pos = rawPos.includes("-")
          ? rawPos.split("-").slice(1).join("-").trim()
          : rawPos.trim();

        // Pincode
        let pincode = inv.buyerDetails?.pinCode || "";
        if (!pincode || String(pincode).trim().length !== 6) {
          const m = (inv.buyerDetails?.address || "").match(/\b[1-9][0-9]{5}\b/);
          if (m) pincode = m[0];
        }

        // Inter-state check
        const sellerGst = inv.sellerDetails?.gstNo?.slice(0, 2) || "19";
        const buyerStateCode =
          gstin.length >= 2
            ? gstin.slice(0, 2)
            : rawPos.includes("-")
            ? rawPos.split("-")[0].trim()
            : "";
        const isInterState =
          buyerStateCode && buyerStateCode !== sellerGst
            ? true
            : !rawPos.toLowerCase().includes("west bengal") && !rawPos.startsWith("19");

        // Line Items
        (inv.lineItems || []).forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const rate = Number(item.taxRate !== undefined ? item.taxRate : item.gstRate) || 3;
          const taxable = Number(
            (item.amount !== undefined ? item.amount : qty * Number(item.unitPrice || 0)).toFixed(2)
          );
          const taxAmt = Number(
            (item.taxAmount !== undefined ? item.taxAmount : (taxable * rate) / 100).toFixed(2)
          );

          const igst = isInterState ? taxAmt : 0;
          const cgst = isInterState ? 0 : Number((taxAmt / 2).toFixed(2));
          const sgst = isInterState ? 0 : Number((taxAmt - cgst).toFixed(2));
          const lineTotal = Number((taxable + taxAmt).toFixed(2));
          const hsn = item.hsnCode || "7117";

          salesRows.push([
            formattedDate,
            invoiceNum,
            gstin,
            pos,
            pincode,
            taxable,
            qty,
            rate,
            igst,
            sgst,
            cgst,
            0,
            0,
            lineTotal,
            hsn,
            "",
          ]);
        });

        // Shipping fee as Composite Supply (3% GST)
        const shipFee = Number(inv.shippingFee) || 0;
        if (shipFee > 0) {
          const shipTaxAmt = Number(((shipFee * 3) / 100).toFixed(2));
          const igst = isInterState ? shipTaxAmt : 0;
          const cgst = isInterState ? 0 : Number((shipTaxAmt / 2).toFixed(2));
          const sgst = isInterState ? 0 : Number((shipTaxAmt - cgst).toFixed(2));
          const shipTotal = Number((shipFee + shipTaxAmt).toFixed(2));
          const shipHsn = inv.lineItems?.[0]?.hsnCode || "7117";

          salesRows.push([
            formattedDate,
            invoiceNum,
            gstin,
            pos,
            pincode,
            shipFee,
            1,
            3,
            igst,
            sgst,
            cgst,
            0,
            0,
            shipTotal,
            shipHsn,
            "",
          ]);
        }
      });

      // Create Workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Sales
      const salesSheet = XLSX.utils.aoa_to_sheet(salesRows);
      salesSheet["!cols"] = [
        { wch: 14 }, // Date
        { wch: 18 }, // Invoice Number
        { wch: 20 }, // GSTIN
        { wch: 20 }, // Place of Supply
        { wch: 12 }, // Pincode
        { wch: 16 }, // Taxable Amount
        { wch: 10 }, // Quantity
        { wch: 10 }, // GST Rate
        { wch: 12 }, // IGST
        { wch: 14 }, // SGST/UTGST
        { wch: 12 }, // CGST
        { wch: 12 }, // CESS Rate
        { wch: 10 }, // CESS
        { wch: 16 }, // Invoice Amount
        { wch: 12 }, // HSN/SAC
        { wch: 20 }, // e-commerce GSTIN
      ];
      XLSX.utils.book_append_sheet(wb, salesSheet, "Sales");

      // Sheet 2: return
      const returnSheet = XLSX.utils.aoa_to_sheet([headers, instructions]);
      returnSheet["!cols"] = salesSheet["!cols"];
      XLSX.utils.book_append_sheet(wb, returnSheet, "return");

      // File Name
      const fileName = `GST_Sales_Report_${gstMonth}_Paid.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`GST Paid Sales Report downloaded: ${fileName}`);
      setShowGstModal(false);
    } catch (err) {
      console.error("GST Export Error:", err);
      toast.error("Failed to export GST sales report");
    } finally {
      setIsExportingGst(false);
    }
  };

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
  }, [showArchived]);

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
      const url = `/api/employee/b2b-invoice?archived=${showArchived}&limit=all`;
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

  // Helper function to extract and normalize state name & code
  const getStateInfo = (rawState) => {
    if (!rawState) return { key: "unspecified", name: "Unspecified State", code: "" };
    const str = String(rawState).trim();
    if (str.includes("-")) {
      const parts = str.split("-");
      const code = parts[0].trim();
      const name = parts.slice(1).join("-").trim();
      return { key: name.toLowerCase(), name, code };
    }
    return { key: str.toLowerCase(), name: str, code: "" };
  };

  // Dynamic customer filter options with counts
  const customerOptions = useMemo(() => {
    const counts = {};
    invoices.forEach((inv) => {
      const name = (inv.buyerDetails?.businessName || "").trim();
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  // Dynamic state filter options with counts
  const stateOptions = useMemo(() => {
    const counts = {};
    invoices.forEach((inv) => {
      const raw = inv.placeOfSupply || inv.buyerDetails?.state || "";
      const info = getStateInfo(raw);
      if (!counts[info.key]) {
        counts[info.key] = { name: info.name, code: info.code, count: 0 };
      }
      counts[info.key].count += 1;
    });
    return Object.values(counts).sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  // Count active applied filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (statusFilter !== "All") count++;
    if (customerFilter !== "All") count++;
    if (stateFilter !== "All") count++;
    if (balanceFilter !== "all") count++;
    if (dateFilterPreset !== "all") count++;
    return count;
  }, [search, statusFilter, customerFilter, stateFilter, balanceFilter, dateFilterPreset]);

  // Reset all applied filters to default
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCustomerFilter("All");
    setStateFilter("All");
    setBalanceFilter("all");
    setDateFilterPreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  // Handle table header column click for sorting
  const handleSortChange = (newColumn) => {
    if (sortColumn === newColumn) {
      const nextDir = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(nextDir);
      setSortByOption(`${newColumn}_${nextDir}`);
    } else {
      setSortColumn(newColumn);
      const defaultDir =
        newColumn === "date" || newColumn === "total" || newColumn === "received" || newColumn === "balance"
          ? "desc"
          : "asc";
      setSortDirection(defaultDir);
      setSortByOption(`${newColumn}_${defaultDir}`);
    }
  };

  // Handle dropdown sort selection
  const handleDropdownSortChange = (val) => {
    setSortByOption(val);
    const [col, dir] = val.split("_");
    setSortColumn(col);
    setSortDirection(dir);
  };

  // 1. Filter invoices according to all active criteria
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search text
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const invNum = (inv.invoiceNumber || "").toLowerCase();
        const custName = (inv.buyerDetails?.businessName || "").toLowerCase();
        const contact = (inv.buyerDetails?.contactPerson || "").toLowerCase();
        const phone = (inv.buyerDetails?.phoneNo || "").toLowerCase();
        const hasMatchingItem = (inv.lineItems || []).some(
          (item) =>
            (item.inventoryId || "").toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (item.hsnCode || "").toLowerCase().includes(q)
        );

        if (
          !invNum.includes(q) &&
          !custName.includes(q) &&
          !contact.includes(q) &&
          !phone.includes(q) &&
          !hasMatchingItem
        ) {
          return false;
        }
      }

      // 2. Status
      if (statusFilter !== "All" && inv.paymentStatus !== statusFilter) {
        return false;
      }

      // 3. Customer
      if (customerFilter !== "All") {
        const cName = (inv.buyerDetails?.businessName || "").trim();
        if (cName !== customerFilter) return false;
      }

      // 4. State
      if (stateFilter !== "All") {
        const invState = getStateInfo(inv.placeOfSupply || inv.buyerDetails?.state || "").name;
        if (invState !== stateFilter) return false;
      }

      // 5. Balance
      if (balanceFilter === "has_balance") {
        const bal =
          inv.balanceAmount !== undefined && inv.balanceAmount !== null
            ? inv.balanceAmount
            : Math.max(0, (inv.grandTotal || 0) - (inv.receivedAmount || 0));
        if (bal <= 0) return false;
      } else if (balanceFilter === "zero_balance") {
        const bal =
          inv.balanceAmount !== undefined && inv.balanceAmount !== null
            ? inv.balanceAmount
            : Math.max(0, (inv.grandTotal || 0) - (inv.receivedAmount || 0));
        if (bal > 0) return false;
      }

      // 6. Date
      if (dateFilterPreset !== "all") {
        if (!inv.invoiceDate) return false;
        const invDate = new Date(inv.invoiceDate);
        if (isNaN(invDate.getTime())) return false;

        const now = new Date();
        if (dateFilterPreset === "this_month") {
          if (
            invDate.getFullYear() !== now.getFullYear() ||
            invDate.getMonth() !== now.getMonth()
          ) {
            return false;
          }
        } else if (dateFilterPreset === "last_month") {
          const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          const lastMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          if (
            invDate.getFullYear() !== lastMonthYear ||
            invDate.getMonth() !== lastMonthIdx
          ) {
            return false;
          }
        } else if (dateFilterPreset === "this_year") {
          const curY = now.getFullYear();
          const fyStart = now.getMonth() >= 3 ? new Date(curY, 3, 1) : new Date(curY - 1, 3, 1);
          const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31, 23, 59, 59, 999);
          if (invDate < fyStart || invDate > fyEnd) return false;
        } else if (dateFilterPreset === "custom") {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (invDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (invDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [
    invoices,
    search,
    statusFilter,
    customerFilter,
    stateFilter,
    balanceFilter,
    dateFilterPreset,
    customStartDate,
    customEndDate,
  ]);

  // 2. Sort filtered invoices
  const sortedInvoices = useMemo(() => {
    const list = [...filteredInvoices];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "invoiceNumber": {
          cmp = (a.invoiceNumber || "").localeCompare(b.invoiceNumber || "", undefined, {
            numeric: true,
            sensitivity: "base",
          });
          break;
        }
        case "date": {
          const tA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          const tB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          cmp = tA - tB;
          break;
        }
        case "customer": {
          const cA = (a.buyerDetails?.businessName || "").toLowerCase();
          const cB = (b.buyerDetails?.businessName || "").toLowerCase();
          cmp = cA.localeCompare(cB);
          break;
        }
        case "items": {
          cmp = (a.lineItems?.length || 0) - (b.lineItems?.length || 0);
          break;
        }
        case "total": {
          cmp = (Number(a.grandTotal) || 0) - (Number(b.grandTotal) || 0);
          break;
        }
        case "received": {
          cmp = (Number(a.receivedAmount) || 0) - (Number(b.receivedAmount) || 0);
          break;
        }
        case "balance": {
          const balA =
            a.balanceAmount !== undefined && a.balanceAmount !== null
              ? a.balanceAmount
              : Math.max(0, (a.grandTotal || 0) - (a.receivedAmount || 0));
          const balB =
            b.balanceAmount !== undefined && b.balanceAmount !== null
              ? b.balanceAmount
              : Math.max(0, (b.grandTotal || 0) - (b.receivedAmount || 0));
          cmp = balA - balB;
          break;
        }
        case "status": {
          cmp = (a.paymentStatus || "").localeCompare(b.paymentStatus || "");
          break;
        }
        default: {
          const tA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          const tB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          cmp = tA - tB;
          break;
        }
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filteredInvoices, sortColumn, sortDirection]);

  // 3. Group sorted invoices by Customer or State
  const groupedData = useMemo(() => {
    if (groupBy === "none") return null;

    const map = new Map();

    sortedInvoices.forEach((inv) => {
      let key = "";
      let title = "";
      let subtitle = "";
      let badge = "";

      if (groupBy === "customer") {
        title = (inv.buyerDetails?.businessName || "").trim() || "Unknown Customer";
        key = title.toLowerCase();
        const parts = [];
        if (inv.buyerDetails?.gstNo && inv.buyerDetails.gstNo !== "NA") {
          parts.push(`GSTIN: ${inv.buyerDetails.gstNo}`);
        }
        if (inv.buyerDetails?.phoneNo) {
          parts.push(`📞 ${inv.buyerDetails.phoneNo}`);
        }
        const st = inv.placeOfSupply || inv.buyerDetails?.state;
        if (st) {
          parts.push(`📍 ${getStateInfo(st).name}`);
        }
        subtitle = parts.join(" • ");
        badge = "Customer";
      } else if (groupBy === "state") {
        const info = getStateInfo(inv.placeOfSupply || inv.buyerDetails?.state || "");
        key = info.key;
        title = info.name;
        subtitle = info.code ? `GST State Code: ${info.code}` : "Place of Supply / Buyer State";
        badge = info.code ? `Code: ${info.code}` : "State";
      }

      if (!map.has(key)) {
        map.set(key, {
          key,
          title,
          subtitle,
          badge,
          invoices: [],
          totalRevenue: 0,
          totalReceived: 0,
          totalBalance: 0,
          paidCount: 0,
          pendingCount: 0,
          partialCount: 0,
          cancelledCount: 0,
        });
      }

      const grp = map.get(key);
      grp.invoices.push(inv);

      const gTotal = Number(inv.grandTotal) || 0;
      const rAmt = Number(inv.receivedAmount) || 0;
      const bAmt =
        inv.balanceAmount !== undefined && inv.balanceAmount !== null
          ? inv.balanceAmount
          : Math.max(0, gTotal - rAmt);

      grp.totalRevenue += gTotal;
      grp.totalReceived += rAmt;
      grp.totalBalance += bAmt;

      const st = inv.paymentStatus || calculatePaymentStatus(gTotal, rAmt);
      if (st === "Paid") grp.paidCount += 1;
      else if (st === "Partially Paid") grp.partialCount += 1;
      else if (st === "Cancelled") grp.cancelledCount += 1;
      else grp.pendingCount += 1;
    });

    return Array.from(map.values());
  }, [sortedInvoices, groupBy]);

  const toggleGroupCollapse = (key) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandAllGroups = () => {
    setCollapsedGroups({});
  };

  const handleCollapseAllGroups = () => {
    if (!groupedData) return;
    const all = {};
    groupedData.forEach((g) => {
      all[g.key] = true;
    });
    setCollapsedGroups(all);
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
    // Ensure lineItems have inventoryId, description, hsnCode, quantity, unitPrice, taxRate, amount, taxAmount, totalAmount
    copy.lineItems = (copy.lineItems || []).map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate !== undefined ? item.taxRate : (item.gstRate !== undefined ? item.gstRate : 3));
      const amount = qty * price;
      const taxAmount = (amount * taxRate) / 100;
      const totalAmount = amount + taxAmount;
      return {
        inventoryId: item.inventoryId || "",
        description: item.description || item.inventoryId || "",
        hsnCode: item.hsnCode || "7117",
        quantity: qty,
        unitPrice: price,
        taxRate,
        amount,
        taxAmount,
        totalAmount,
      };
    });
    setEditingInvoice(copy);
    setShowEditModal(true);
  };

  // Inventory Picker Handlers (for Edit Modal)
  const openInventoryPicker = (index) => {
    setInventoryPickerIndex(index);
    setInventorySearch("");
    setTimeout(() => {
      if (pickerSearchRef.current) {
        pickerSearchRef.current.focus();
      }
    }, 50);
  };

  const closeInventoryPicker = () => {
    setInventoryPickerIndex(null);
    setInventorySearch("");
  };

  const selectInventoryItem = (inv) => {
    if (inventoryPickerIndex === null || !editingInvoice) return;
    const updated = [...editingInvoice.lineItems];
    if (updated[inventoryPickerIndex]) {
      updated[inventoryPickerIndex].inventoryId = inv.inventoryId;
      updated[inventoryPickerIndex].description = inv.inventoryId;
      updated[inventoryPickerIndex].hsnCode = updated[inventoryPickerIndex].hsnCode || "7117";
      const qty = Number(updated[inventoryPickerIndex].quantity) || 1;
      const price = Number(updated[inventoryPickerIndex].unitPrice) || 0;
      const taxRate = Number(updated[inventoryPickerIndex].taxRate !== undefined ? updated[inventoryPickerIndex].taxRate : 3);
      const amount = qty * price;
      const taxAmount = (amount * taxRate) / 100;
      updated[inventoryPickerIndex].amount = amount;
      updated[inventoryPickerIndex].taxAmount = taxAmount;
      updated[inventoryPickerIndex].totalAmount = amount + taxAmount;
    }
    setEditingInvoice({
      ...editingInvoice,
      lineItems: updated,
    });
    closeInventoryPicker();
  };

  const filteredInventory = useMemo(() => {
    if (!inventorySearch.trim()) return inventoryList;
    const q = inventorySearch.toLowerCase().trim();
    return inventoryList.filter(
      (inv) =>
        inv.inventoryId?.toLowerCase().includes(q) ||
        inv.vertical?.toLowerCase().includes(q)
    );
  }, [inventoryList, inventorySearch]);

  // Multi-Select Inventory Handlers (for Edit Modal)
  const openMultiSelectModal = () => {
    if (!editingInvoice) return;
    setIsMultiSelectOpen(true);
    const existingIds = (editingInvoice.lineItems || [])
      .map((item) => item.inventoryId)
      .filter((id) => Boolean(id) && String(id).trim() !== "");
    setSelectedInvIds(Array.from(new Set(existingIds)));
    setMultiSelectSearch("");
    setTimeout(() => {
      if (multiSearchRef.current) {
        multiSearchRef.current.focus();
      }
    }, 50);
  };

  const closeMultiSelectModal = () => {
    setIsMultiSelectOpen(false);
    setSelectedInvIds([]);
    setMultiSelectSearch("");
  };

  const toggleInvSelection = (invId) => {
    setSelectedInvIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    );
  };

  const handleSelectAllFiltered = (filteredList) => {
    const ids = filteredList.map((i) => i.inventoryId);
    setSelectedInvIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedInvIds([]);
  };

  const handleAddBlankRowFromModal = () => {
    addEditLineItem();
    closeMultiSelectModal();
  };

  const handleAddSelectedItems = () => {
    if (!editingInvoice) return;
    const existingMap = new Map();
    (editingInvoice.lineItems || []).forEach((item) => {
      if (item.inventoryId) {
        existingMap.set(item.inventoryId, item);
      }
    });

    const customRows = (editingInvoice.lineItems || []).filter(
      (item) => !item.inventoryId && (item.description || Number(item.unitPrice) > 0)
    );

    const updatedInvRows = selectedInvIds.map((invId) => {
      if (existingMap.has(invId)) {
        return existingMap.get(invId);
      }
      return {
        inventoryId: invId,
        description: invId,
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        taxRate: 3,
        amount: 0,
        taxAmount: 0,
        totalAmount: 0,
      };
    });

    const finalRows = [...updatedInvRows, ...customRows];
    if (finalRows.length === 0) {
      finalRows.push({
        inventoryId: "",
        description: "New Item",
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        taxRate: 3,
        amount: 0,
        taxAmount: 0,
        totalAmount: 0,
      });
    }

    setEditingInvoice({
      ...editingInvoice,
      lineItems: finalRows,
    });
    toast.success(`Updated line items with ${selectedInvIds.length} selected item(s)`);
    closeMultiSelectModal();
  };

  const filteredMultiInventory = useMemo(() => {
    if (!multiSelectSearch.trim()) return inventoryList;
    const q = multiSelectSearch.toLowerCase().trim();
    return inventoryList.filter(
      (inv) =>
        inv.inventoryId?.toLowerCase().includes(q) ||
        inv.vertical?.toLowerCase().includes(q)
    );
  }, [inventoryList, multiSelectSearch]);

  // Edit Modal Item Handlers
  const handleEditLineItemChange = (index, field, value) => {
    if (!editingInvoice) return;
    const updatedItems = [...editingInvoice.lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "inventoryId" && value) {
      const selectedItem = inventoryList.find((i) => i.inventoryId === value);
      if (selectedItem) {
        updatedItems[index].description = selectedItem.inventoryId;
      }
    }

    // Recalculate row amounts
    const qty = Number(updatedItems[index].quantity) || 0;
    const price = Number(updatedItems[index].unitPrice) || 0;
    const gstRate = Number(updatedItems[index].taxRate !== undefined ? updatedItems[index].taxRate : 3) || 0;

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

  // Live calculation of financial totals in Edit Modal
  const editCalculations = useMemo(() => {
    if (!editingInvoice) {
      return {
        subtotal: 0,
        itemsTax: 0,
        shippingFee: 0,
        shippingTax: 0,
        totalTax: 0,
        discount: 0,
        grandTotal: 0,
        receivedAmount: 0,
        balanceAmount: 0,
      };
    }

    const subtotal = (editingInvoice.lineItems || []).reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);

    const itemsTax = (editingInvoice.lineItems || []).reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const rate = Number(item.taxRate !== undefined ? item.taxRate : 3) || 0;
      return sum + (qty * price * rate) / 100;
    }, 0);

    const shippingFee = Number(editingInvoice.shippingFee) || 0;
    const shippingTax = (shippingFee * 3) / 100;
    const totalTax = itemsTax + shippingTax;
    const discount = Number(editingInvoice.discount) || 0;
    const grandTotal = subtotal + shippingFee + totalTax - discount;
    const receivedAmount = Number(editingInvoice.receivedAmount) || 0;
    const balanceAmount = grandTotal - receivedAmount;

    return {
      subtotal,
      itemsTax,
      shippingFee,
      shippingTax,
      totalTax,
      discount,
      grandTotal,
      receivedAmount,
      balanceAmount,
    };
  }, [editingInvoice]);

  // Save Edit Submission
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setIsSavingEdit(true);

    const {
      subtotal,
      totalTax,
      grandTotal,
      balanceAmount,
    } = editCalculations;

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
    const invoicesToExport = sortedInvoices && sortedInvoices.length > 0 ? sortedInvoices : invoices;
    if (!invoicesToExport || invoicesToExport.length === 0) {
      toast.error("No invoices available to export.");
      return;
    }

    // ── Calculate Summary Statistics ────────────────────────────────
    let totalInvoices = invoicesToExport.length;
    let totalRevenue = 0;
    let totalReceived = 0;
    let totalBalance = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    // Buyer Summary breakdown map
    const buyerSummaryMap = {};

    invoicesToExport.forEach((inv) => {
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
    const groupedReportData = [
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

    invoicesToExport.forEach((inv) => {
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
      groupedReportData.push([
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
        groupedReportData.push([
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

      groupedReportData.push([]); // Blank spacing row between invoices
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

    invoicesToExport.forEach((inv) => {
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
    const groupedSheet = XLSX.utils.aoa_to_sheet(groupedReportData);
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

  // Metrics Calculations based on filtered invoices
  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.grandTotal || 0),
    0
  );
  const totalReceived = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.receivedAmount || 0),
    0
  );
  const totalBalance = filteredInvoices.reduce(
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

  const modalItemsTax =
    editingInvoice?.lineItems?.reduce(
      (sum, item) => sum + (Number(item.taxAmount) || 0),
      0
    ) || 0;

  const modalShippingVal = Number(editingInvoice?.shippingFee || 0);
  const modalShippingTax = (modalShippingVal * 3) / 100;
  const modalTotalTax = modalItemsTax + modalShippingTax;

  const modalGrandTotal =
    modalSubtotal +
    modalShippingVal +
    modalTotalTax -
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

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>All B2B Invoices</h1>
          <p className={styles.subtitle}>
            Manage, edit, search, and export all generated sales invoices.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.downloadGstBtn}
            onClick={() => setShowGstModal(true)}
            title="Download GST Filing Sales Report (Monthly)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            GST Sales Report (Monthly)
          </button>

          <button
            type="button"
            className={styles.downloadExcelBtn}
            onClick={exportInvoicesToExcel}
            title="Download Invoices Excel Report"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Excel
          </button>

          <Link href="/create-b2b-invoice" className={styles.createBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Invoice
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconBlue}`}>📄</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Invoices</span>
            <span className={styles.metricValue}>
              {filteredInvoices.length}
              {filteredInvoices.length !== invoices.length && (
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#a1a1aa", marginLeft: "6px" }}>
                  (of {invoices.length})
                </span>
              )}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconGreen}`}>₹</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Revenue</span>
            <span className={styles.metricValue}>
              ₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconAmber}`}>💳</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Received</span>
            <span className={styles.metricValue}>
              ₹{totalReceived.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconRed}`}>⚠️</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Outstanding Balance</span>
            <span className={styles.metricValue}>
              ₹{totalBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Controls: Tabs, Grouping, Filter Toolbar */}
      <div className={styles.controlsWrapper}>
        {/* Top Control Bar: Active/Archived Tabs + Group By Selector + Group Actions + Refresh */}
        <div className={styles.controlBar}>
          <div className={styles.tabGroup}>
            <button
              id="tab-active-invoices"
              type="button"
              className={`${styles.tabItem} ${!showArchived ? styles.activeTabItem : ""}`}
              onClick={() => setShowArchived(false)}
            >
              Active Invoices
            </button>
            <button
              id="tab-archived-invoices"
              type="button"
              className={`${styles.tabItem} ${showArchived ? styles.activeTabItem : ""}`}
              onClick={() => setShowArchived(true)}
            >
              Archived Invoices 🗑️
            </button>
          </div>

          {/* Grouping Segmented Control */}
          <div className={styles.groupingControl}>
            <span className={styles.controlLabel}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Group By:
            </span>
            <div className={styles.groupingSegmented}>
              <button
                id="group-by-none"
                type="button"
                className={`${styles.groupingBtn} ${groupBy === "none" ? styles.groupingBtnActive : ""}`}
                onClick={() => setGroupBy("none")}
                title="No Grouping (Flat Table)"
              >
                None
              </button>
              <button
                id="group-by-customer"
                type="button"
                className={`${styles.groupingBtn} ${groupBy === "customer" ? styles.groupingBtnActive : ""}`}
                onClick={() => setGroupBy("customer")}
                title="Group by Customer / Buyer"
              >
                👤 Customer
              </button>
              <button
                id="group-by-state"
                type="button"
                className={`${styles.groupingBtn} ${groupBy === "state" ? styles.groupingBtnActive : ""}`}
                onClick={() => setGroupBy("state")}
                title="Group by State / Place of Supply"
              >
                📍 State
              </button>
            </div>

            {groupBy !== "none" && (
              <div className={styles.expandCollapseBtnGroup}>
                <button
                  id="btn-expand-all"
                  type="button"
                  className={styles.miniActionBtn}
                  onClick={handleExpandAllGroups}
                  title="Expand All Groups"
                >
                  Expand All
                </button>
                <button
                  id="btn-collapse-all"
                  type="button"
                  className={styles.miniActionBtn}
                  onClick={handleCollapseAllGroups}
                  title="Collapse All Groups"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>

          <button
            id="btn-refresh-invoices"
            type="button"
            className={styles.refreshBtn}
            onClick={fetchInvoices}
            disabled={loading}
            title="Refresh Invoices"
          >
            <RefreshIcon />
            Refresh
          </button>
        </div>

        {/* Secondary Filter Toolbar */}
        <div className={styles.filterToolbar}>
          {/* Search Box */}
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              id="search-input"
              type="text"
              className={styles.searchInput}
              placeholder="Search Invoice #, Customer, SKU, Description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearch("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className={styles.filterGroup}>
            {/* Customer Filter */}
            <select
              id="customer-filter"
              className={styles.filterSelect}
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              title="Filter by Customer"
            >
              <option value="All">All Customers ({customerOptions.length})</option>
              {customerOptions.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>

            {/* State Filter */}
            <select
              id="state-filter"
              className={styles.filterSelect}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              title="Filter by State / Place of Supply"
            >
              <option value="All">All States ({stateOptions.length})</option>
              {stateOptions.map((st) => (
                <option key={st.name} value={st.name}>
                  {st.code ? `${st.code} - ` : ""}{st.name} ({st.count})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              id="status-filter"
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by Payment Status"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Balance Filter */}
            <select
              id="balance-filter"
              className={styles.filterSelect}
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              title="Filter by Payment Balance"
            >
              <option value="all">All Balance Types</option>
              <option value="has_balance">Has Balance Due (&gt; ₹0)</option>
              <option value="zero_balance">Fully Settled (₹0 Due)</option>
            </select>

            {/* Date Preset Filter */}
            <select
              id="date-filter"
              className={styles.filterSelect}
              value={dateFilterPreset}
              onChange={(e) => setDateFilterPreset(e.target.value)}
              title="Filter by Date Range"
            >
              <option value="all">All Dates</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Financial Year</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {/* Sort Selection */}
            <select
              id="sort-select"
              className={styles.sortSelect}
              value={sortByOption}
              onChange={(e) => handleDropdownSortChange(e.target.value)}
              title="Sort Invoices"
            >
              <option value="date_desc">📅 Date: Newest First</option>
              <option value="date_asc">📅 Date: Oldest First</option>
              <option value="invoiceNumber_asc">🔢 Invoice #: Low → High</option>
              <option value="invoiceNumber_desc">🔢 Invoice #: High → Low</option>
              <option value="customer_asc">👤 Customer: A → Z</option>
              <option value="customer_desc">👤 Customer: Z → A</option>
              <option value="total_desc">💰 Total: High → Low</option>
              <option value="total_asc">💰 Total: Low → High</option>
              <option value="balance_desc">⚠️ Balance: High → Low</option>
              <option value="balance_asc">⚠️ Balance: Low → High</option>
              <option value="received_desc">💳 Received: High → Low</option>
            </select>

            {/* Reset Filters Button */}
            {activeFilterCount > 0 && (
              <button
                id="reset-filters-btn"
                type="button"
                className={styles.resetFiltersBtn}
                onClick={handleResetFilters}
                title="Reset all applied filters"
              >
                <span>Reset Filters</span>
                <span className={styles.filterBadgeCount}>{activeFilterCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Row */}
        {dateFilterPreset === "custom" && (
          <div className={styles.customDateContainer}>
            <span className={styles.dateInputLabel}>From:</span>
            <input
              type="date"
              className={styles.customDateInput}
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span className={styles.dateInputLabel}>To:</span>
            <input
              type="date"
              className={styles.customDateInput}
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                className={styles.miniActionBtn}
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Invoices Table */}
      <div className={styles.tableCard}>
        <table className={styles.invoiceTable}>
          <thead>
            <tr>
              <th
                className={`${styles.sortableTh} ${sortColumn === "invoiceNumber" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("invoiceNumber")}
                title="Sort by Invoice Number"
              >
                <div className={styles.thContent}>
                  <span>Invoice #</span>
                  <span className={sortColumn === "invoiceNumber" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "invoiceNumber" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th
                className={`${styles.sortableTh} ${sortColumn === "date" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("date")}
                title="Sort by Date"
              >
                <div className={styles.thContent}>
                  <span>Date</span>
                  <span className={sortColumn === "date" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "date" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th
                className={`${styles.sortableTh} ${sortColumn === "customer" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("customer")}
                title="Sort by Customer Name"
              >
                <div className={styles.thContent}>
                  <span>Customer</span>
                  <span className={sortColumn === "customer" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "customer" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th
                className={`${styles.sortableTh} ${sortColumn === "items" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("items")}
                title="Sort by Line Items Count"
              >
                <div className={styles.thContent}>
                  <span>Items</span>
                  <span className={sortColumn === "items" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "items" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th
                className={`${styles.sortableTh} ${sortColumn === "total" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("total")}
                title="Sort by Grand Total"
              >
                <div className={styles.thContent}>
                  <span>Grand Total</span>
                  <span className={sortColumn === "total" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "total" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th
                className={`${styles.sortableTh} ${sortColumn === "received" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("received")}
                title="Sort by Amount Received"
              >
                <div className={styles.thContent}>
                  <span>Received</span>
                  <span className={sortColumn === "received" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "received" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th
                className={`${styles.sortableTh} ${sortColumn === "balance" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("balance")}
                title="Sort by Balance Due"
              >
                <div className={styles.thContent}>
                  <span>Balance</span>
                  <span className={sortColumn === "balance" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "balance" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th
                className={`${styles.sortableTh} ${sortColumn === "status" ? styles.activeSortTh : ""}`}
                onClick={() => handleSortChange("status")}
                title="Sort by Payment Status"
              >
                <div className={styles.thContent}>
                  <span>Status</span>
                  <span className={sortColumn === "status" ? styles.sortIndicator : styles.sortIndicatorInactive}>
                    {sortColumn === "status" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>

              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "#a1a1aa", padding: "40px" }}>
                  <div className={styles.tableLoadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <span>Loading invoices...</span>
                  </div>
                </td>
              </tr>
            ) : sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "#a1a1aa", padding: "40px" }}>
                  <div className={styles.emptyTableState}>
                    <span style={{ fontSize: "28px" }}>🔍</span>
                    <p style={{ margin: "8px 0 4px", fontWeight: "600", color: "#e4e4e7" }}>
                      No invoices found matching criteria.
                    </p>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        className={styles.resetFiltersBtn}
                        onClick={handleResetFilters}
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : groupBy === "none" ? (
              sortedInvoices.map((inv) => {
                const invBalance =
                  inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
                    ? inv.balanceAmount
                    : Math.max(0, (inv.grandTotal || 0) - (inv.receivedAmount || 0));

                return (
                  <tr key={inv._id}>
                    <td className={styles.invNumber}>{inv.invoiceNumber}</td>
                    <td>{inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}</td>
                    <td className={styles.customerName}>
                      <div>{inv.buyerDetails?.businessName || "N/A"}</div>
                      <div className={styles.tableRowSubtext}>
                        {getStateInfo(inv.placeOfSupply || inv.buyerDetails?.state || "").name}
                      </div>
                    </td>
                    <td>{inv.lineItems?.length || 0} items</td>
                    <td style={{ fontWeight: "700", color: "#34d399" }}>
                      ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
                    </td>
                    <td>₹{(inv.receivedAmount || 0).toLocaleString("en-IN")}</td>
                    <td style={{ fontWeight: "600", color: invBalance > 0 ? "#f87171" : "#a1a1aa" }}>
                      ₹{invBalance.toLocaleString("en-IN")}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          inv.paymentStatus === "Paid"
                            ? styles.statusPaid
                            : inv.paymentStatus === "Pending"
                            ? styles.statusPending
                            : inv.paymentStatus === "Partially Paid"
                            ? styles.statusPartial
                            : styles.statusCancelled
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td style={{ position: "relative" }}>
                      <div className={styles.actionMenuWrapper} data-action-menu>
                        <button
                          type="button"
                          className={styles.threeDotsBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === inv._id ? null : inv._id);
                          }}
                          title="Actions"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="5" r="1.5"></circle>
                            <circle cx="12" cy="12" r="1.5"></circle>
                            <circle cx="12" cy="19" r="1.5"></circle>
                          </svg>
                        </button>

                        {openMenuId === inv._id && (
                          <div className={styles.dropdownMenu}>
                            {!showArchived ? (
                              <>
                                <button
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenGraphicalModal(inv);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                  View (Graphical)
                                </button>
                                <button
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenPdf(inv);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                  </svg>
                                  PDF Preview
                                </button>
                                {(inv.paymentStatus === "Pending" ||
                                  inv.paymentStatus === "Partially Paid" ||
                                  (inv.balanceAmount !== undefined
                                    ? inv.balanceAmount > 0
                                    : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
                                  <button
                                    type="button"
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleOpenPaymentQr(inv);
                                    }}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                                      <rect x="3" y="3" width="7" height="7"></rect>
                                      <rect x="14" y="3" width="7" height="7"></rect>
                                      <rect x="14" y="14" width="7" height="7"></rect>
                                      <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    Payment QR (Balance)
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenEdit(inv);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                  Edit Invoice
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button
                                  type="button"
                                  className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleArchive(inv._id, inv.invoiceNumber);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                  Archive
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenGraphicalModal(inv);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                  View (Graphical)
                                </button>
                                <button
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenPdf(inv);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                  </svg>
                                  PDF Preview
                                </button>
                                {(inv.paymentStatus === "Pending" ||
                                  inv.paymentStatus === "Partially Paid" ||
                                  (inv.balanceAmount !== undefined
                                    ? inv.balanceAmount > 0
                                    : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
                                  <button
                                    type="button"
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleOpenPaymentQr(inv);
                                    }}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                                      <rect x="3" y="3" width="7" height="7"></rect>
                                      <rect x="14" y="3" width="7" height="7"></rect>
                                      <rect x="14" y="14" width="7" height="7"></rect>
                                      <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    Payment QR (Balance)
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleRestore(inv._id, inv.invoiceNumber);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                    <polyline points="1 4 1 10 7 10"></polyline>
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                  </svg>
                                  Restore Invoice
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button
                                  type="button"
                                  className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handlePermanentDelete(inv._id, inv.invoiceNumber);
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                  Delete Permanently
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              groupedData.map((group) => {
                const isCollapsed = collapsedGroups[group.key];
                return (
                  <React.Fragment key={group.key}>
                    <tr
                      className={styles.groupHeaderRow}
                      onClick={() => toggleGroupCollapse(group.key)}
                      title={`Click to ${isCollapsed ? "expand" : "collapse"} this group`}
                    >
                      <td colSpan="9" className={styles.groupHeaderCell}>
                        <div className={styles.groupHeaderContent}>
                          <div className={styles.groupHeaderLeft}>
                            <button
                              type="button"
                              className={styles.groupToggleBtn}
                              aria-label={isCollapsed ? "Expand group" : "Collapse group"}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                                  transition: "transform 0.2s ease",
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                            <span className={styles.groupTypeIcon}>
                              {groupBy === "customer" ? "🏢" : "📍"}
                            </span>
                            <div className={styles.groupInfoBlock}>
                              <div className={styles.groupTitleLine}>
                                <span className={styles.groupTitleText}>{group.title}</span>
                                {group.badge && (
                                  <span className={styles.groupBadge}>{group.badge}</span>
                                )}
                              </div>
                              {group.subtitle && (
                                <div className={styles.groupSubtitleText}>{group.subtitle}</div>
                              )}
                            </div>
                          </div>

                          <div className={styles.groupHeaderRight} onClick={(e) => e.stopPropagation()}>
                            <span className={styles.groupCountPill}>
                              {group.invoices.length} {group.invoices.length === 1 ? "invoice" : "invoices"}
                            </span>
                            <div className={styles.groupMetricPill}>
                              <span className={styles.metricPillLabel}>Total:</span>
                              <span className={styles.metricPillValGreen}>
                                ₹{group.totalRevenue.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className={styles.groupMetricPill}>
                              <span className={styles.metricPillLabel}>Recv:</span>
                              <span className={styles.metricPillValBlue}>
                                ₹{group.totalReceived.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className={styles.groupMetricPill}>
                              <span className={styles.metricPillLabel}>Due:</span>
                              <span className={group.totalBalance > 0 ? styles.metricPillValRed : styles.metricPillValMuted}>
                                ₹{group.totalBalance.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed &&
                      group.invoices.map((inv) => {
                        const invBalance =
                          inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
                            ? inv.balanceAmount
                            : Math.max(0, (inv.grandTotal || 0) - (inv.receivedAmount || 0));

                        return (
                          <tr key={inv._id} className={styles.groupedRow}>
                            <td className={styles.invNumber}>{inv.invoiceNumber}</td>
                            <td>{inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}</td>
                            <td className={styles.customerName}>
                              <div>{inv.buyerDetails?.businessName || "N/A"}</div>
                              {groupBy !== "state" && (
                                <div className={styles.tableRowSubtext}>
                                  {getStateInfo(inv.placeOfSupply || inv.buyerDetails?.state || "").name}
                                </div>
                              )}
                            </td>
                            <td>{inv.lineItems?.length || 0} items</td>
                            <td style={{ fontWeight: "700", color: "#34d399" }}>
                              ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
                            </td>
                            <td>₹{(inv.receivedAmount || 0).toLocaleString("en-IN")}</td>
                            <td style={{ fontWeight: "600", color: invBalance > 0 ? "#f87171" : "#a1a1aa" }}>
                              ₹{invBalance.toLocaleString("en-IN")}
                            </td>
                            <td>
                              <span
                                className={`${styles.statusBadge} ${
                                  inv.paymentStatus === "Paid"
                                    ? styles.statusPaid
                                    : inv.paymentStatus === "Pending"
                                    ? styles.statusPending
                                    : inv.paymentStatus === "Partially Paid"
                                    ? styles.statusPartial
                                    : styles.statusCancelled
                                }`}
                              >
                                {inv.paymentStatus}
                              </span>
                            </td>
                            <td style={{ position: "relative" }}>
                              <div className={styles.actionMenuWrapper} data-action-menu>
                                <button
                                  type="button"
                                  className={styles.threeDotsBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === inv._id ? null : inv._id);
                                  }}
                                  title="Actions"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="5" r="1.5"></circle>
                                    <circle cx="12" cy="12" r="1.5"></circle>
                                    <circle cx="12" cy="19" r="1.5"></circle>
                                  </svg>
                                </button>

                                {openMenuId === inv._id && (
                                  <div className={styles.dropdownMenu}>
                                    {!showArchived ? (
                                      <>
                                        <button
                                          type="button"
                                          className={styles.dropdownItem}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleOpenGraphicalModal(inv);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                          </svg>
                                          View (Graphical)
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.dropdownItem}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleOpenPdf(inv);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                          </svg>
                                          PDF Preview
                                        </button>
                                        {(inv.paymentStatus === "Pending" ||
                                          inv.paymentStatus === "Partially Paid" ||
                                          (inv.balanceAmount !== undefined
                                            ? inv.balanceAmount > 0
                                            : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
                                          <button
                                            type="button"
                                            className={styles.dropdownItem}
                                            onClick={() => {
                                              setOpenMenuId(null);
                                              handleOpenPaymentQr(inv);
                                            }}
                                          >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                                              <rect x="3" y="3" width="7" height="7"></rect>
                                              <rect x="14" y="3" width="7" height="7"></rect>
                                              <rect x="14" y="14" width="7" height="7"></rect>
                                              <rect x="3" y="14" width="7" height="7"></rect>
                                            </svg>
                                            Payment QR (Balance)
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className={styles.dropdownItem}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleOpenEdit(inv);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                          </svg>
                                          Edit Invoice
                                        </button>
                                        <div className={styles.dropdownDivider} />
                                        <button
                                          type="button"
                                          className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleArchive(inv._id, inv.invoiceNumber);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                          </svg>
                                          Archive
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className={styles.dropdownItem}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleOpenGraphicalModal(inv);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                          </svg>
                                          View (Graphical)
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.dropdownItem}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleOpenPdf(inv);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                          </svg>
                                          PDF Preview
                                        </button>
                                        {(inv.paymentStatus === "Pending" ||
                                          inv.paymentStatus === "Partially Paid" ||
                                          (inv.balanceAmount !== undefined
                                            ? inv.balanceAmount > 0
                                            : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
                                          <button
                                            type="button"
                                            className={styles.dropdownItem}
                                            onClick={() => {
                                              setOpenMenuId(null);
                                              handleOpenPaymentQr(inv);
                                            }}
                                          >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                                              <rect x="3" y="3" width="7" height="7"></rect>
                                              <rect x="14" y="3" width="7" height="7"></rect>
                                              <rect x="14" y="14" width="7" height="7"></rect>
                                              <rect x="3" y="14" width="7" height="7"></rect>
                                            </svg>
                                            Payment QR (Balance)
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className={styles.dropdownItem}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleRestore(inv._id, inv.invoiceNumber);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                            <polyline points="1 4 1 10 7 10"></polyline>
                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                          </svg>
                                          Restore Invoice
                                        </button>
                                        <div className={styles.dropdownDivider} />
                                        <button
                                          type="button"
                                          className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handlePermanentDelete(inv._id, inv.invoiceNumber);
                                          }}
                                        >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                          </svg>
                                          Delete Permanently
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT INVOICE MODAL */}
      {showEditModal && editingInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Edit Invoice #{editingInvoice.invoiceNumber}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.modalSectionTitle}>Invoice Header</div>
              <div className={styles.modalGrid}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Invoice Number</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.invoiceNumber}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        invoiceNumber: e.target.value.toUpperCase(),
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Invoice Date</label>
                  <input
                    type="date"
                    className={styles.modalInput}
                    value={editingInvoice.invoiceDate || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        invoiceDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Place of Supply</label>
                  <select
                    className={styles.modalSelect}
                    value={editingInvoice.placeOfSupply || "19-West Bengal"}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        placeOfSupply: e.target.value,
                      })
                    }
                  >
                    {GST_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Payment Status</label>
                  <select
                    className={styles.modalSelect}
                    value={editingInvoice.paymentStatus || "Pending"}
                    onChange={(e) => {
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
                    }}
                  >
                    <option
                      value="Pending"
                      disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Pending"}
                    >
                      Pending {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Pending" ? "(Auto)" : ""}
                    </option>
                    <option
                      value="Paid"
                      disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Paid"}
                    >
                      Paid {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Paid" ? "(Auto)" : ""}
                    </option>
                    <option
                      value="Partially Paid"
                      disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Partially Paid"}
                    >
                      Partially Paid {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Partially Paid" ? "(Auto)" : ""}
                    </option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalSectionTitle}>Customer / Buyer Info</div>
              <div className={styles.modalGrid}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Customer Name</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.businessName || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          businessName: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Contact No</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.phoneNo || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          phoneNo: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. +91 9876543210"
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>GSTIN</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.gstNo || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          gstNo: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Address</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.address || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          address: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>State</label>
                  <select
                    className={styles.modalSelect}
                    value={editingInvoice.buyerDetails?.state || "19-West Bengal"}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          state: e.target.value,
                        },
                      })
                    }
                  >
                    {GST_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", marginBottom: "10px" }}>
                <div className={styles.modalSectionTitle} style={{ margin: 0 }}>
                  Line Items ({editingInvoice.lineItems?.length || 0})
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className={styles.addMultiSelectBtn}
                    onClick={openMultiSelectModal}
                    title="Select items from inventory catalog"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Select from Inventory
                  </button>
                  <button
                    type="button"
                    className={styles.addBlankItemBtn}
                    onClick={addEditLineItem}
                    title="Add empty custom item row"
                  >
                    + Add Blank Item
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className={styles.editItemsTableContainer}>
                <table className={styles.editItemsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "23%" }}>Inventory SKU / ID</th>
                      <th style={{ width: "27%" }}>Description</th>
                      <th style={{ width: "10%" }}>HSN/SAC</th>
                      <th style={{ width: "8%" }}>Qty</th>
                      <th style={{ width: "12%" }}>Unit Price (₹)</th>
                      <th style={{ width: "7%" }}>GST %</th>
                      <th style={{ width: "9%" }}>Total (₹)</th>
                      <th style={{ width: "4%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingInvoice.lineItems.map((item, idx) => {
                      const selectedInv = inventoryList.find(
                        (inv) => inv.inventoryId === item.inventoryId
                      );
                      const qty = Number(item.quantity) || 0;
                      const price = Number(item.unitPrice) || 0;
                      const rate = Number(item.taxRate !== undefined ? item.taxRate : 3) || 0;
                      const itemTotal = qty * price * (1 + rate / 100);

                      return (
                        <tr key={idx}>
                          <td>
                            <button
                              type="button"
                              className={`${styles.inventoryPickerBtn} ${
                                item.inventoryId ? styles.inventoryPickerBtnFilled : ""
                              }`}
                              onClick={() => openInventoryPicker(idx)}
                              onMouseEnter={(e) => {
                                if (selectedInv?.imageUrl) {
                                  setHoveredImage({
                                    url: selectedInv.imageUrl,
                                    id: selectedInv.inventoryId,
                                    x: e.clientX,
                                    y: e.clientY,
                                  });
                                }
                              }}
                              onMouseMove={(e) => {
                                if (selectedInv?.imageUrl) {
                                  setHoveredImage((prev) =>
                                    prev
                                      ? { ...prev, x: e.clientX, y: e.clientY }
                                      : {
                                          url: selectedInv.imageUrl,
                                          id: selectedInv.inventoryId,
                                          x: e.clientX,
                                          y: e.clientY,
                                        }
                                  );
                                }
                              }}
                              onMouseLeave={() => setHoveredImage(null)}
                              title="Click to select inventory item"
                            >
                              {selectedInv?.imageUrl ? (
                                <img
                                  src={selectedInv.imageUrl}
                                  alt={item.inventoryId}
                                  className={styles.pickerBtnImg}
                                />
                              ) : (
                                <span className={styles.pickerBtnIcon}>
                                  <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                  </svg>
                                </span>
                              )}
                              <span
                                className={
                                  item.inventoryId
                                    ? styles.pickerBtnId
                                    : styles.pickerBtnPlaceholder
                                }
                              >
                                {item.inventoryId || "Select SKU..."}
                              </span>
                              <span className={styles.pickerBtnChevron}>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </span>
                            </button>
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.modalInput}
                              style={{ width: "100%" }}
                              placeholder="Description / SKU"
                              value={item.description}
                              onChange={(e) =>
                                handleEditLineItemChange(idx, "description", e.target.value)
                              }
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.modalInput}
                              style={{ width: "100%" }}
                              placeholder="HSN"
                              value={item.hsnCode || "7117"}
                              onChange={(e) =>
                                handleEditLineItemChange(idx, "hsnCode", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className={styles.modalInput}
                              style={{ width: "100%" }}
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) =>
                                handleEditLineItemChange(idx, "quantity", e.target.value)
                              }
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={styles.modalInput}
                              style={{ width: "100%" }}
                              placeholder="Unit Price"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleEditLineItemChange(idx, "unitPrice", e.target.value)
                              }
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              className={styles.modalInput}
                              style={{ width: "100%" }}
                              placeholder="GST %"
                              value={item.taxRate !== undefined ? item.taxRate : 3}
                              onChange={(e) =>
                                handleEditLineItemChange(idx, "taxRate", e.target.value)
                              }
                            />
                          </td>
                          <td style={{ color: "#34d399", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" }}>
                            ₹{itemTotal.toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "none",
                                color: "#f87171",
                                cursor: "pointer",
                                borderRadius: "6px",
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                              }}
                              title="Delete row"
                              onClick={() => removeEditLineItem(idx)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.modalSectionTitle}>Payment & Totals</div>
              <div className={styles.modalGrid}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>UPI Barcode / UPI ID</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.sellerDetails?.upiId || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        sellerDetails: {
                          ...editingInvoice.sellerDetails,
                          upiId: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. 033311501063323@slice"
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Shipping Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.modalInput}
                    value={editingInvoice.shippingFee || 0}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        shippingFee: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.modalInput}
                    value={editingInvoice.discount || 0}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        discount: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Received Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.modalInput}
                    value={editingInvoice.receivedAmount || 0}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        receivedAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Live Calculations Summary Box */}
              <div className={styles.editSummaryBox}>
                <div className={styles.editSummaryRow}>
                  <span>Subtotal:</span>
                  <span>₹{editCalculations.subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.editSummaryRow}>
                  <span>Shipping Fee:</span>
                  <span>₹{editCalculations.shippingFee.toFixed(2)}</span>
                </div>
                <div className={styles.editSummaryRow}>
                  <span>
                    Total GST (Items + 3% on Shipping):
                    <span style={{ fontSize: "11px", color: "#a1a1aa", marginLeft: "6px" }}>
                      (Items: ₹{editCalculations.itemsTax.toFixed(2)} + Shipping: ₹{editCalculations.shippingTax.toFixed(2)})
                    </span>
                  </span>
                  <span>₹{editCalculations.totalTax.toFixed(2)}</span>
                </div>
                {editCalculations.discount > 0 && (
                  <div className={styles.editSummaryRow} style={{ color: "#f87171" }}>
                    <span>Discount:</span>
                    <span>-₹{editCalculations.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className={`${styles.editSummaryRow} ${styles.editGrandTotalRow}`}>
                  <span>Grand Total:</span>
                  <span>₹{editCalculations.grandTotal.toFixed(2)}</span>
                </div>
                <div className={styles.editSummaryRow}>
                  <span>Received Amount:</span>
                  <span>₹{editCalculations.receivedAmount.toFixed(2)}</span>
                </div>
                <div
                  className={styles.editSummaryRow}
                  style={{
                    fontWeight: "700",
                    color: editCalculations.balanceAmount > 0 ? "#f87171" : "#34d399",
                  }}
                >
                  <span>Balance Due:</span>
                  <span>₹{editCalculations.balanceAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? "Saving Changes..." : "Save Invoice Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Inventory Selection Picker Modal */}
      {inventoryPickerIndex !== null && (
        <div className={styles.pickerOverlay} onClick={closeInventoryPicker}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.pickerHeader}>
              <div>
                <h3 className={styles.pickerTitle}>Select Inventory Item</h3>
                <p className={styles.pickerSubtitle}>
                  Choose an inventory item to insert into this invoice line item.
                </p>
              </div>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                onClick={closeInventoryPicker}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className={styles.pickerSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.pickerSearchIcon}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={pickerSearchRef}
                type="text"
                className={styles.pickerSearchInput}
                placeholder="Search by SKU / Inventory ID or vertical..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
              {inventorySearch && (
                <button
                  type="button"
                  className={styles.pickerSearchClear}
                  onClick={() => setInventorySearch("")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Grid */}
            <div className={styles.pickerGrid}>
              {filteredInventory.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>No inventory items found.</span>
                </div>
              ) : (
                filteredInventory.map((inv) => {
                  const isSelected =
                    editingInvoice?.lineItems[inventoryPickerIndex]?.inventoryId === inv.inventoryId;
                  return (
                    <button
                      key={inv._id || inv.inventoryId}
                      type="button"
                      className={`${styles.pickerCard} ${
                        isSelected ? styles.pickerCardSelected : ""
                      }`}
                      onClick={() => selectInventoryItem(inv)}
                    >
                      <div className={styles.pickerCardImg}>
                        {inv.imageUrl ? (
                          <img src={inv.imageUrl} alt={inv.inventoryId} />
                        ) : (
                          <span className={styles.pickerCardNoImg}>No Image</span>
                        )}
                        {isSelected && (
                          <span className={styles.pickerSelectedTick}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className={styles.pickerCardId}>{inv.inventoryId}</span>
                      {inv.currentStock !== undefined && (
                        <span
                          className={`${styles.pickerCardStock} ${
                            inv.currentStock <= 5 ? styles.pickerCardLowStock : ""
                          }`}
                        >
                          Stock: {inv.currentStock ?? 0}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Select Inventory Modal */}
      {isMultiSelectOpen && (
        <div className={styles.pickerOverlay} onClick={closeMultiSelectModal}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.pickerHeader}>
              <div>
                <h3 className={styles.pickerTitle}>Select Inventory Items</h3>
                <p className={styles.pickerSubtitle}>
                  Choose one or multiple items to batch-update/add to this invoice.
                </p>
              </div>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                onClick={closeMultiSelectModal}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className={styles.pickerSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.pickerSearchIcon}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={multiSearchRef}
                type="text"
                className={styles.pickerSearchInput}
                placeholder="Search by SKU / Inventory ID or vertical..."
                value={multiSelectSearch}
                onChange={(e) => setMultiSelectSearch(e.target.value)}
              />
              {multiSelectSearch && (
                <button
                  type="button"
                  className={styles.pickerSearchClear}
                  onClick={() => setMultiSelectSearch("")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Sub-bar with count & quick select actions */}
            <div className={styles.multiSelectBar}>
              <span className={styles.selectedCountTag}>
                {selectedInvIds.length} item{selectedInvIds.length !== 1 ? "s" : ""} selected
              </span>
              <div className={styles.quickSelectActions}>
                <button
                  type="button"
                  className={styles.quickSelectBtn}
                  onClick={() => handleSelectAllFiltered(filteredMultiInventory)}
                >
                  Select All Filtered
                </button>
                {selectedInvIds.length > 0 && (
                  <button
                    type="button"
                    className={styles.quickSelectBtn}
                    style={{ color: "#f87171" }}
                    onClick={handleClearSelection}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Items */}
            <div className={styles.pickerGrid}>
              {filteredMultiInventory.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>No inventory items found.</span>
                </div>
              ) : (
                filteredMultiInventory.map((inv) => {
                  const isSelected = selectedInvIds.includes(inv.inventoryId);
                  return (
                    <button
                      key={inv._id || inv.inventoryId}
                      type="button"
                      className={`${styles.pickerCard} ${
                        isSelected ? styles.pickerCardSelected : ""
                      }`}
                      onClick={() => toggleInvSelection(inv.inventoryId)}
                    >
                      <div className={styles.pickerCardImg}>
                        {inv.imageUrl ? (
                          <img src={inv.imageUrl} alt={inv.inventoryId} />
                        ) : (
                          <span className={styles.pickerCardNoImg}>No Image</span>
                        )}
                        {isSelected && (
                          <span className={styles.pickerSelectedTick}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className={styles.pickerCardId}>{inv.inventoryId}</span>
                      {inv.currentStock !== undefined && (
                        <span
                          className={`${styles.pickerCardStock} ${
                            inv.currentStock <= 5 ? styles.pickerCardLowStock : ""
                          }`}
                        >
                          Stock: {inv.currentStock ?? 0}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className={styles.multiSelectFooter}>
              <button
                type="button"
                className={styles.addBlankBtn}
                onClick={handleAddBlankRowFromModal}
              >
                + Add Blank Row
              </button>

              <button
                type="button"
                className={styles.addSelectedBtn}
                onClick={handleAddSelectedItems}
              >
                {selectedInvIds.length > 0
                  ? `Apply Selection (${selectedInvIds.length} Item${selectedInvIds.length !== 1 ? "s" : ""})`
                  : "Apply (0 Items Selected)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cursor Image Tooltip */}
      {hoveredImage && (
        <div
          className={styles.cursorImageTooltip}
          style={{
            left: `${Math.min(hoveredImage.x + 20, typeof window !== "undefined" ? window.innerWidth - 250 : 800)}px`,
            top: `${Math.min(hoveredImage.y + 20, typeof window !== "undefined" ? window.innerHeight - 270 : 600)}px`,
          }}
        >
          <img
            src={hoveredImage.url}
            alt={hoveredImage.id}
            className={styles.cursorTooltipImg}
          />
          {hoveredImage.id && (
            <div className={styles.cursorTooltipTag}>{hoveredImage.id}</div>
          )}
        </div>
      )}

      {/* VIEW PDF / PRINT MODAL */}
      {showPdfModal && viewingInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: "880px", background: "#18181b", color: "#ffffff" }}>
            <div className={styles.pdfModalHeader} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ffffff", fontSize: "13px", cursor: "pointer", marginRight: "12px", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
                />
                <span>Show QR Code</span>
              </label>
              <button
                type="button"
                className={styles.createBtn}
                style={{ padding: "8px 18px", background: "#10b981" }}
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
              >
                {isDownloadingPdf ? "Downloading..." : "Download PDF"}
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                style={{ color: "#ffffff", fontSize: "24px" }}
                onClick={() => setShowPdfModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Reusable Exact Replica PDF Component */}
            <InvoicePdfPreview ref={pdfPreviewRef} invoice={viewingInvoice} showQrCode={showQrCode} />
          </div>
        </div>
      )}

      {/* Graphical View Modal (Invoice Details & Inventory Images) */}
      {showGraphicalModal && graphicalModalInvoice && (
        <div className={styles.modalOverlay} onClick={() => setShowGraphicalModal(false)}>
          <div className={styles.graphicalModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.pickerHeader}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h3 className={styles.pickerTitle} style={{ margin: 0 }}>
                    Invoice #{graphicalModalInvoice.invoiceNumber}
                  </h3>
                  <span
                    className={`${styles.statusBadge} ${
                      graphicalModalInvoice.paymentStatus === "Paid"
                        ? styles.statusPaid
                        : graphicalModalInvoice.paymentStatus === "Pending"
                        ? styles.statusPending
                        : graphicalModalInvoice.paymentStatus === "Partially Paid"
                        ? styles.statusPartial
                        : styles.statusCancelled
                    }`}
                  >
                    {graphicalModalInvoice.paymentStatus}
                  </span>
                </div>
                <p className={styles.pickerSubtitle} style={{ marginTop: "4px" }}>
                  Date: {formatDateGB(graphicalModalInvoice.invoiceDate)} • Place of Supply: {graphicalModalInvoice.placeOfSupply || "19-West Bengal"}
                </p>
              </div>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                onClick={() => setShowGraphicalModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className={styles.graphicalModalBody}>
              {/* Customer & Seller Grid */}
              <div className={styles.graphicalGrid2}>
                {/* Customer Card */}
                <div className={styles.graphicalInfoBox}>
                  <div className={styles.graphicalInfoTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    Customer Info
                  </div>
                  <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "15px" }}>
                    {graphicalModalInvoice.buyerDetails?.businessName || "N/A"}
                  </div>
                  {graphicalModalInvoice.buyerDetails?.phoneNo && (
                    <div className={styles.graphicalInfoText}>
                      Phone: {graphicalModalInvoice.buyerDetails.phoneNo}
                    </div>
                  )}
                  {graphicalModalInvoice.buyerDetails?.address && (
                    <div className={styles.graphicalInfoText}>
                      Address: {graphicalModalInvoice.buyerDetails.address}
                    </div>
                  )}
                  <div className={styles.graphicalInfoText}>
                    GSTIN: {graphicalModalInvoice.buyerDetails?.gstNo || "NA"} | State: {graphicalModalInvoice.buyerDetails?.state || "19-West Bengal"}
                  </div>
                </div>

                {/* Seller Card */}
                <div className={styles.graphicalInfoBox}>
                  <div className={styles.graphicalInfoTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Seller Details
                  </div>
                  <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "15px" }}>
                    {graphicalModalInvoice.sellerDetails?.businessName || "CRAZYKUDI"}
                  </div>
                  <div className={styles.graphicalInfoText}>
                    GSTIN: {graphicalModalInvoice.sellerDetails?.gstNo || "19JHWPK2955Q1ZW"}
                  </div>
                  {graphicalModalInvoice.sellerDetails?.bankName && (
                    <div className={styles.graphicalInfoText}>
                      Bank: {graphicalModalInvoice.sellerDetails.bankName} (A/C: {graphicalModalInvoice.sellerDetails.accountNo})
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Graphical View */}
              <div>
                <div className={styles.graphicalInfoTitle} style={{ marginBottom: "10px", color: "#ec4899" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  Items & Inventory Images ({graphicalModalInvoice.lineItems?.length || 0})
                </div>

                <div className={styles.graphicalItemsContainer}>
                  {graphicalModalInvoice.lineItems?.map((item, idx) => {
                    const matchedInv = inventoryList.find(
                      (inv) => inv.inventoryId === item.inventoryId
                    );
                    const imgUrl = matchedInv?.imageUrl || item.imageUrl;
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.unitPrice) || 0;
                    const subtotalAmt = item.amount !== undefined ? Number(item.amount) : qty * price;
                    const taxRate = Number(item.taxRate !== undefined ? item.taxRate : item.gstRate) || 0;
                    const taxAmt = item.taxAmount !== undefined ? Number(item.taxAmount) : (subtotalAmt * taxRate) / 100;
                    const totalAmt = item.totalAmount !== undefined ? Number(item.totalAmount) : subtotalAmt + taxAmt;

                    return (
                      <div key={idx} className={styles.graphicalItemCard}>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.inventoryId || item.description}
                            className={styles.graphicalItemImg}
                          />
                        ) : (
                          <div className={styles.graphicalItemNoImg}>No Image</div>
                        )}

                        <div className={styles.graphicalItemDetails}>
                          {item.inventoryId && (
                            <span className={styles.graphicalItemIdTag}>
                              {item.inventoryId}
                            </span>
                          )}
                          <div className={styles.graphicalItemDesc}>{item.description || "Line Item"}</div>
                          <div className={styles.graphicalItemMeta}>
                            <span>HSN: {item.hsnCode || "7117"}</span>
                            <span>•</span>
                            <span>Qty: {qty}</span>
                            <span>•</span>
                            <span>Unit Price: ₹{price.toFixed(2)}</span>
                            <span>•</span>
                            <span>GST: {taxRate}% (₹{taxAmt.toFixed(2)})</span>
                          </div>
                        </div>

                        <div className={styles.graphicalItemPricing}>
                          <div className={styles.graphicalItemTotal}>
                            ₹{totalAmt.toFixed(2)}
                          </div>
                          <div className={styles.graphicalItemSub}>
                            Sub: ₹{subtotalAmt.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className={styles.summaryContainer} style={{ marginTop: 0 }}>
                <div className={styles.summaryBox} style={{ width: "100%" }}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal:</span>
                    <span>₹{(graphicalModalInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {graphicalModalInvoice.shippingFee > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Shipping Fee:</span>
                      <span>₹{(graphicalModalInvoice.shippingFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.summaryRow}>
                    <span>GST Total:</span>
                    <span>₹{(graphicalModalInvoice.totalTax || 0).toFixed(2)}</span>
                  </div>
                  {graphicalModalInvoice.discount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Discount:</span>
                      <span>- ₹{(graphicalModalInvoice.discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
                    <span>Grand Total:</span>
                    <span>₹{(graphicalModalInvoice.grandTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Received Amount:</span>
                    <span>₹{(graphicalModalInvoice.receivedAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow} style={{ fontWeight: "700", color: "#f87171" }}>
                    <span>Balance Due:</span>
                    <span>₹{(graphicalModalInvoice.balanceAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes if present */}
              {graphicalModalInvoice.notes && (
                <div className={styles.graphicalInfoBox}>
                  <div className={styles.graphicalInfoTitle} style={{ color: "#f59e0b" }}>
                    Notes & Terms
                  </div>
                  <div className={styles.graphicalInfoText} style={{ whiteSpace: "pre-line", fontSize: "13px", color: "#a1a1aa" }}>
                    {graphicalModalInvoice.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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

      {/* GST Filing Monthly Sales Report Modal */}
      {showGstModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGstModal(false)}>
          <div className={styles.gstModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(139, 92, 246, 0.2)",
                    color: "#a78bfa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  📊
                </div>
                <div>
                  <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: "18px" }}>
                    GST Sales Report (GSTR-1 Monthly)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#a1a1aa" }}>
                    Paid invoices only • Standard ClearTax &amp; Government compatible format
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowGstModal(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div className={styles.modalGrid} style={{ gridTemplateColumns: "1fr auto", alignItems: "end", margin: 0 }}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Select Filing Month &amp; Year</label>
                  <input
                    type="month"
                    className={styles.modalInput}
                    value={gstMonth}
                    onChange={(e) => setGstMonth(e.target.value)}
                    style={{ fontSize: "15px", fontWeight: "600" }}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#d4d4d8", fontSize: "13px", cursor: "pointer", paddingBottom: "10px" }}>
                  <input
                    type="checkbox"
                    checked={gstIncludeArchived}
                    onChange={(e) => setGstIncludeArchived(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#8b5cf6" }}
                  />
                  <span>Include Archived</span>
                </label>
              </div>

              {/* Monthly Overview Box */}
              <div className={styles.gstSummaryBox}>
                <div className={styles.gstSummaryRow}>
                  <span>Paid Invoices Found:</span>
                  <strong>{isFetchingGst ? "Loading..." : `${gstMonthStats.invoiceCount} paid invoices (${gstMonthStats.rowCount} line items)`}</strong>
                </div>
                <div className={styles.gstSummaryRow}>
                  <span>Total Taxable Sales (₹):</span>
                  <strong>₹{gstMonthStats.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className={styles.gstSummaryRow}>
                  <span>CGST (₹):</span>
                  <strong>₹{gstMonthStats.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className={styles.gstSummaryRow}>
                  <span>SGST (₹):</span>
                  <strong>₹{gstMonthStats.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className={styles.gstSummaryRow}>
                  <span>IGST (₹):</span>
                  <strong>₹{gstMonthStats.igst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className={styles.gstSummaryRow}>
                  <span>Total GST Tax (₹):</span>
                  <strong style={{ color: "#34d399" }}>₹{gstMonthStats.totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className={`${styles.gstSummaryRow} ${styles.gstSummaryTotal}`}>
                  <span>Total Paid Invoice Value (₹):</span>
                  <span>₹{gstMonthStats.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {gstMonthStats.invoiceCount === 0 && !isFetchingGst && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "13px" }}>
                  ⚠️ No paid invoices found for {gstMonth}. Only invoices with "Paid" status are included for GST filing.
                </div>
              )}
            </div>

            <div className={styles.modalFooter} style={{ marginTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "16px" }}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowGstModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.downloadGstConfirmBtn}
                onClick={handleExportGstReport}
                disabled={isFetchingGst || isExportingGst || gstMonthStats.invoiceCount === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {isExportingGst ? "Generating Excel..." : `Download GST Excel (${gstMonth})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
