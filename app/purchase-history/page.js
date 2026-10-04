"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "./page.module.css";

import { parseSearchQuery, matchesArraySearchTerms } from "../../utils/searchUtils";
import * as XLSX from "xlsx";

export default function PurchaseHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);

  // View Mode: 'grouped' (default) vs 'flat'
  const [viewMode, setViewMode] = useState("grouped");
  const [expandedGroups, setExpandedGroups] = useState({});

  // Show archived toggle
  const [showArchived, setShowArchived] = useState(false);
  const [archivedPurchases, setArchivedPurchases] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [archivedExpandedGroups, setArchivedExpandedGroups] = useState({});

  // Filtering & Pagination & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [sortConfig, setSortConfig] = useState({ key: "orderedOn", direction: "desc" });

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Archive Modal State
  const [archiveTarget, setArchiveTarget] = useState(null); // purchase object
  const [archiveInput, setArchiveInput] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const archiveInputRef = useRef(null);

  // Restore Modal State
  const [restoreTarget, setRestoreTarget] = useState(null); // purchase object
  const [restoreInput, setRestoreInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreInputRef = useRef(null);

  // Delete Modal State (PIN)
  const [deleteTarget, setDeleteTarget] = useState(null); // archived purchase object
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const pinInputRef = useRef(null);



  // Hovered Image Popover State
  const [hoveredImage, setHoveredImage] = useState(null);

  const handleImageMouseEnter = (e, item) => {
    if (!item?.imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const previewWidth = 220;
    const previewHeight = 230;

    let left = rect.right + 12;
    if (left + previewWidth > window.innerWidth) {
      left = rect.left - previewWidth - 12;
    }

    let top = rect.top + rect.height / 2 - previewHeight / 2;
    if (top < 10) top = 10;
    if (top + previewHeight > window.innerHeight - 10) {
      top = window.innerHeight - previewHeight - 10;
    }

    setHoveredImage({
      url: item.imageUrl,
      title: item.inventoryId || "Inventory Item",
      left,
      top,
    });
  };

  const handleImageMouseLeave = () => {
    setHoveredImage(null);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/purchase?history=true");
      const result = await res.json();
      if (res.ok && result.success) {
        setPurchases(result.purchases || []);
      } else {
        toast.error(result.error || "Failed to load purchase history", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error loading history", { id: "app-feedback", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedPurchases = async () => {
    setLoadingArchived(true);
    try {
      const res = await fetch("/api/employee/purchase?history=true&archived=true");
      const result = await res.json();
      if (res.ok && result.success) {
        setArchivedPurchases(result.purchases || []);
      } else {
        toast.error(result.error || "Failed to load archived records", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error loading archived records", { id: "app-feedback", duration: 3000 });
    } finally {
      setLoadingArchived(false);
    }
  };

  const toggleShowArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    if (next && archivedPurchases.length === 0) {
      fetchArchivedPurchases();
    }
  };

  // ── Calculate item total cost ────────────────────────────────────
  const calculateTotal = (p) => {
    const qty = Number(p.quantity || 0);
    const price = Number(p.price || 0);
    const subtotal = qty * price;
    const taxAmount = (subtotal * Number(p.taxPercentage || 0)) / 100;
    return subtotal + Number(p.shippingFee || 0) + taxAmount;
  };

  // ── Calculate final unit price (including Shipping and Tax) ──────
  const calculateFinalUnitPrice = (p) => {
    const qty = Number(p.quantity || 0);
    if (qty <= 0) return 0;
    return calculateTotal(p) / qty;
  };

  // ── Multi-Sheet Excel Export (Summary, Grouped, Flat List) ────────
  const exportGroupedToExcel = () => {
    const targetGroups = showArchived ? archivedProcessedGroups : processedGroups;
    const targetItems = showArchived ? archivedPurchases : filteredItems;

    if (!targetGroups || targetGroups.length === 0) {
      toast.error("No purchase data available to export.", { id: "app-feedback", duration: 3000 });
      return;
    }

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

    // Write file
    const fileName = `Purchase_History_Report_${showArchived ? "Archived_" : ""}${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success(`Successfully generated Excel report: ${fileName}`, { id: "app-feedback", duration: 3000 });
  };

  // ── Copy helper ──────────────────────────────────────────────────
  const copyToClipboard = (text, label = "Text") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} "${text}" to clipboard!`, { id: "app-feedback", duration: 3000 });
  };

  // ── Archive flow ────────────────────────────────────────────────
  const openArchiveModal = (p) => {
    setArchiveTarget(p);
    setArchiveInput("");
    setTimeout(() => archiveInputRef.current?.focus(), 80);
  };

  const closeArchiveModal = () => {
    setArchiveTarget(null);
    setArchiveInput("");
  };

  const confirmArchive = async () => {
    if (archiveInput.trim().toLowerCase() !== "archive") return;
    setIsArchiving(true);
    try {
      const res = await fetch("/api/employee/purchase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: archiveTarget._id, action: "archive" }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPurchases(prev => prev.filter(p => p._id !== archiveTarget._id));
        if (showArchived) fetchArchivedPurchases();
        toast.success("Purchase archived successfully.", { id: "app-feedback", duration: 3000 });
        closeArchiveModal();
      } else {
        toast.error(result.error || "Failed to archive", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error. Try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsArchiving(false);
    }
  };

  // ── Restore flow ────────────────────────────────────────────────
  const openRestoreModal = (p) => {
    setRestoreTarget(p);
    setRestoreInput("");
    setTimeout(() => restoreInputRef.current?.focus(), 80);
  };

  const closeRestoreModal = () => {
    setRestoreTarget(null);
    setRestoreInput("");
  };

  const confirmRestore = async () => {
    if (restoreInput.trim().toLowerCase() !== "restore") return;
    setIsRestoring(true);
    try {
      const res = await fetch("/api/employee/purchase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: restoreTarget._id, action: "restore" }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setArchivedPurchases(prev => prev.filter(p => p._id !== restoreTarget._id));
        fetchPurchases();
        toast.success("Purchase restored successfully.", { id: "app-feedback", duration: 3000 });
        closeRestoreModal();
      } else {
        toast.error(result.error || "Failed to restore", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error. Try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsRestoring(false);
    }
  };

  // ── Permanent delete flow (PIN) ─────────────────────────────────
  const openDeleteModal = (p) => {
    setDeleteTarget(p);
    setPinInput("");
    setPinError("");
    setTimeout(() => pinInputRef.current?.focus(), 80);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setPinInput("");
    setPinError("");
  };

  const confirmDelete = async () => {
    if (!pinInput) { setPinError("Please enter your PIN."); return; }
    setIsDeleting(true);
    setPinError("");
    try {
      const res = await fetch(
        `/api/employee/purchase?id=${deleteTarget._id}&pin=${encodeURIComponent(pinInput)}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        setArchivedPurchases(prev => prev.filter(p => p._id !== deleteTarget._id));
        toast.success("Purchase permanently deleted.", { id: "app-feedback", duration: 3000 });
        closeDeleteModal();
      } else {
        setPinError(result.error || "Failed to delete.");
      }
    } catch {
      setPinError("Network error. Try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Sorting ─────────────────────────────────────────────────────
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // ── Grouping logic helper ────────────────────────────────────────
  const groupPurchases = (list) => {
    const map = {};

    list.forEach((p) => {
      const sellerIdStr = p.sellerId?._id || p.sellerId?.businessName || "unknown_seller";
      const sellerName = p.sellerId?.businessName || "Unknown Seller";
      const invoiceNo = (p.invoiceNo && p.invoiceNo.trim()) ? p.invoiceNo.trim() : "No Invoice";
      const groupKey = `${sellerIdStr}_${invoiceNo.toLowerCase()}`;

      if (!map[groupKey]) {
        map[groupKey] = {
          groupKey,
          sellerIdStr,
          sellerName,
          invoiceNo,
          items: [],
          totalQuantity: 0,
          totalSubtotal: 0,
          totalShipping: 0,
          totalTax: 0,
          totalAmount: 0,
          orderedOn: p.orderedOn,
          deliveredCount: 0,
        };
      }

      const grp = map[groupKey];
      grp.items.push(p);

      const qty = Number(p.quantity || 0);
      const price = Number(p.price || 0);
      const subtotal = qty * price;
      const shipping = Number(p.shippingFee || 0);
      const tax = (subtotal * Number(p.taxPercentage || 0)) / 100;
      const itemTotal = subtotal + shipping + tax;

      grp.totalQuantity += qty;
      grp.totalSubtotal += subtotal;
      grp.totalShipping += shipping;
      grp.totalTax += tax;
      grp.totalAmount += itemTotal;

      if (p.receivedOn) {
        grp.deliveredCount += 1;
      }

      if (new Date(p.orderedOn || 0) > new Date(grp.orderedOn || 0)) {
        grp.orderedOn = p.orderedOn;
      }
    });

    return Object.values(map).map((grp) => {
      let groupStatus = "In-Transit";
      if (grp.deliveredCount === grp.items.length) {
        groupStatus = "Delivered";
      } else if (grp.deliveredCount > 0) {
        groupStatus = `Partial (${grp.deliveredCount}/${grp.items.length})`;
      }
      return {
        ...grp,
        groupStatus,
        itemCount: grp.items.length
      };
    });
  };

  // ── Process Active Purchases ────────────────────────────────────
  const { filteredItems, processedGroups, summaryStats } = useMemo(() => {
    let filtered = purchases;

    // Filter by search query
    if (searchQuery.trim()) {
      const { includeTerms, excludeTerms } = parseSearchQuery(searchQuery);
      filtered = filtered.filter(p => {
        const searchableFields = [
          p.inventoryId,
          p.invoiceNo,
          p.sellerId?.businessName,
          p.sellerProductId
        ].filter(Boolean);
        return matchesArraySearchTerms(searchableFields, includeTerms, excludeTerms);
      });
    }

    // Filter by status
    if (statusFilter !== "All") {
      filtered = filtered.filter(p => {
        const isDelivered = !!p.receivedOn;
        if (statusFilter === "Delivered") return isDelivered;
        if (statusFilter === "In-Transit") return !isDelivered;
        return true;
      });
    }

    // Calculate overall stats before grouping
    let totalStockQty = 0;
    let totalCost = 0;
    filtered.forEach(p => {
      totalStockQty += Number(p.quantity || 0);
      totalCost += calculateTotal(p);
    });

    // Grouping
    let groups = groupPurchases(filtered);

    // Summary Stats
    const stats = {
      totalInvoices: groups.length,
      totalItems: filtered.length,
      totalStockQty,
      totalCost,
    };

    // Sort Groups or Flat Items
    if (viewMode === "grouped") {
      groups.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === "sellerId") { aValue = a.sellerName; bValue = b.sellerName; }
        else if (sortConfig.key === "total") { aValue = a.totalAmount; bValue = b.totalAmount; }
        else if (sortConfig.key === "quantity") { aValue = a.totalQuantity; bValue = b.totalQuantity; }
        else if (sortConfig.key === "itemCount") { aValue = a.itemCount; bValue = b.itemCount; }
        if (aValue === null || aValue === undefined) aValue = "";
        if (bValue === null || bValue === undefined) bValue = "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === "sellerId") { aValue = a.sellerId?.businessName || ""; bValue = b.sellerId?.businessName || ""; }
        else if (sortConfig.key === "total") { aValue = calculateTotal(a); bValue = calculateTotal(b); }
        else if (sortConfig.key === "finalUnitPrice") { aValue = calculateFinalUnitPrice(a); bValue = calculateFinalUnitPrice(b); }
        if (aValue === null || aValue === undefined) aValue = "";
        if (bValue === null || bValue === undefined) bValue = "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return { filteredItems: filtered, processedGroups: groups, summaryStats: stats };
  }, [purchases, searchQuery, statusFilter, sortConfig, viewMode]);

  // ── Process Archived Purchases ──────────────────────────────────
  const archivedProcessedGroups = useMemo(() => {
    let groups = groupPurchases(archivedPurchases);
    return groups;
  }, [archivedPurchases]);

  // ── Pagination math ─────────────────────────────────────────────
  const totalPages = Math.ceil(
    (viewMode === "grouped" ? processedGroups.length : filteredItems.length) / itemsPerPage
  );

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedGroups.slice(start, start + itemsPerPage);
  }, [processedGroups, currentPage, itemsPerPage]);

  const paginatedFlatItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, viewMode]);

  // ── Expand/Collapse controls ─────────────────────────────────────
  const toggleGroupExpand = (groupKey, isArchivedView = false) => {
    if (isArchivedView) {
      setArchivedExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    } else {
      setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    }
  };

  const expandAllGroups = (isArchivedView = false) => {
    const targetGroups = isArchivedView ? archivedProcessedGroups : processedGroups;
    const allExp = {};
    targetGroups.forEach(g => { allExp[g.groupKey] = true; });
    if (isArchivedView) setArchivedExpandedGroups(allExp);
    else setExpandedGroups(allExp);
  };

  const collapseAllGroups = (isArchivedView = false) => {
    if (isArchivedView) setArchivedExpandedGroups({});
    else setExpandedGroups({});
  };

  const isAllExpanded = (isArchivedView = false) => {
    const targetGroups = isArchivedView ? archivedProcessedGroups : processedGroups;
    const currentExp = isArchivedView ? archivedExpandedGroups : expandedGroups;
    if (targetGroups.length === 0) return false;
    return targetGroups.every(g => !!currentExp[g.groupKey]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  // ── Edit modal controls ──────────────────────────────────────────
  const openEditModal = (p) => {
    setEditingData({
      _id: p._id,
      quantity: p.quantity,
      price: p.price,
      shippingFee: p.shippingFee || 0,
      taxPercentage: p.taxPercentage || 0,
      invoiceNo: p.invoiceNo || "",
      orderedOn: toInputDate(p.orderedOn),
      receivedOn: toInputDate(p.receivedOn),
    });
    setIsEditing(true);
  };

  const closeEditModal = () => { setIsEditing(false); setEditingData(null); };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const payload = { ...editingData };
      if (!payload.receivedOn) payload.receivedOn = null;
      const res = await fetch("/api/employee/purchase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPurchases(purchases.map(p => p._id === result.data._id ? result.data : p));
        toast.success("Purchase updated successfully!", { id: "app-feedback", duration: 3000 });
        closeEditModal();
      } else {
        toast.error(result.error || "Failed to update purchase", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error saving purchase", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className={styles.sortPlaceholder}>↕</span>;
    return <span className={styles.sortActive}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  // ── TABLE RENDERER: GROUPED VIEW ─────────────────────────────────
  const renderGroupedTable = (groups, isArchived = false) => {
    const currentExpState = isArchived ? archivedExpandedGroups : expandedGroups;

    return (
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "45px" }} className={styles.th}></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("invoiceNo")}>Invoice No <SortIcon columnKey="invoiceNo" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("sellerId")}>Seller <SortIcon columnKey="sellerId" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("orderedOn")}>Order Date <SortIcon columnKey="orderedOn" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("itemCount")}>Items <SortIcon columnKey="itemCount" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("quantity")}>Total Qty <SortIcon columnKey="quantity" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("total")}>Total Cost <SortIcon columnKey="total" /></th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right", paddingRight: "1.5rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.noData}>
                    {isArchived ? "No archived purchase records." : "No purchase records found matching your filters."}
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const isExpanded = !!currentExpState[group.groupKey];
                  return (
                    <React.Fragment key={group.groupKey}>
                      <tr
                        className={`${styles.tr} ${styles.groupRow} ${isExpanded ? styles.expandedGroupRow : ""} ${isArchived ? styles.archivedRow : ""}`}
                        onClick={() => toggleGroupExpand(group.groupKey, isArchived)}
                      >
                        <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                          <button
                            className={styles.expandChevronBtn}
                            onClick={() => toggleGroupExpand(group.groupKey, isArchived)}
                            title={isExpanded ? "Collapse group" : "Expand group"}
                          >
                            <Icon name="icon-40639b2b" size={16} className={`${styles.chevronIcon} ${isExpanded?styles.chevronRotated:""}`} />
                          </button>
                        </td>
                        <td className={`${styles.td} ${styles.invoiceCell}`}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span className={styles.invoiceText}>{group.invoiceNo}</span>
                            {group.invoiceNo !== "No Invoice" && (
                              <button
                                className={styles.copyBtnSmall}
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(group.invoiceNo, "Invoice No"); }}
                                title="Copy Invoice No"
                              >
                                <Icon name="copy-inventory-id" size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={`${styles.td} ${styles.sellerCell}`}>{group.sellerName}</td>
                        <td className={styles.td}>{formatDate(group.orderedOn)}</td>
                        <td className={styles.td}>
                          <span className={styles.itemCountBadge}>{group.itemCount} {group.itemCount === 1 ? 'item' : 'items'}</span>
                        </td>
                        <td className={`${styles.td} ${styles.quantity}`}>{group.totalQuantity} units</td>
                        <td className={`${styles.td} ${styles.total}`}>₹{group.totalAmount.toFixed(2)}</td>
                        <td className={styles.td}>
                          <span className={`${styles.status} ${group.deliveredCount === group.itemCount ? styles.received : group.deliveredCount > 0 ? styles.partial : styles.pending}`}>
                            <span className={styles.dot}></span>
                            {group.groupStatus}
                          </span>
                        </td>
                        <td className={styles.td} style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                          <span style={{ fontSize: "0.8rem", color: isExpanded ? "#3b82f6" : "#64748b", fontWeight: 500 }}>
                            {isExpanded ? "Hide items ▲" : "Show items ▼"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Sub-table */}
                      {isExpanded && (
                        <tr className={styles.nestedRow}>
                          <td colSpan="9" style={{ padding: 0 }}>
                            <div className={styles.nestedContainer}>
                              <div className={styles.nestedHeader}>
                                <div className={styles.nestedHeaderTitle}>
                                  <Icon name="pdf-preview" size={14} />
                                  Invoice Items ({group.items.length}) — {group.sellerName} [{group.invoiceNo}]
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                  Group Total: <strong style={{ color: "#fff" }}>₹{group.totalAmount.toFixed(2)}</strong> ({group.totalQuantity} units)
                                </div>
                              </div>

                              <table className={styles.nestedTable}>
                                <thead>
                                  <tr>
                                    <th className={styles.nestedTh}>Image</th>
                                    <th className={styles.nestedTh}>Order Date</th>
                                    <th className={styles.nestedTh}>Seller SKU</th>
                                    <th className={styles.nestedTh}>Internal ID</th>
                                    <th className={styles.nestedTh}>Qty</th>
                                    <th className={styles.nestedTh}>Unit Price</th>
                                    <th className={styles.nestedTh}>Final Unit Price</th>
                                    <th className={styles.nestedTh}>Shipping & Tax</th>
                                    <th className={styles.nestedTh}>Item Total</th>
                                    <th className={styles.nestedTh}>Received On</th>
                                    <th className={styles.nestedTh}>Status</th>
                                    <th className={styles.nestedTh} style={{ textAlign: "center" }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items.map((p) => {
                                    const itemTotal = calculateTotal(p);
                                    const finalUnitPrice = calculateFinalUnitPrice(p);
                                    const subtotal = p.quantity * p.price;
                                    const taxAmount = (subtotal * (p.taxPercentage || 0)) / 100;
                                    return (
                                      <tr key={p._id}>
                                        <td className={styles.nestedTd}>
                                          {p.imageUrl ? (
                                            <div 
                                              className={styles.imageWrapper}
                                              onMouseEnter={(e) => handleImageMouseEnter(e, p)}
                                              onMouseLeave={handleImageMouseLeave}
                                            >
                                              <img src={p.imageUrl} alt={p.inventoryId || "Item"} className={styles.itemImageThumbnail} />
                                            </div>
                                          ) : (
                                            <div className={styles.imagePlaceholder}>NA</div>
                                          )}
                                        </td>
                                        <td className={styles.nestedTd}>{formatDate(p.orderedOn)}</td>
                                        <td className={styles.nestedTd}>{p.sellerProductId}</td>
                                        <td className={`${styles.nestedTd} ${styles.idCell}`}>{p.inventoryId}</td>
                                        <td className={`${styles.nestedTd} ${styles.quantity}`}>{p.quantity}</td>
                                        <td className={`${styles.nestedTd} ${styles.price}`}>₹{p.price.toFixed(2)}</td>
                                        <td className={`${styles.nestedTd} ${styles.finalUnitPrice}`}>₹{finalUnitPrice.toFixed(2)}</td>
                                        <td className={styles.nestedTd} style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                          ₹{p.shippingFee || 0} ship | {p.taxPercentage || 0}% tax (₹{taxAmount.toFixed(2)})
                                        </td>
                                        <td className={`${styles.nestedTd} ${styles.total}`}>₹{itemTotal.toFixed(2)}</td>
                                        <td className={styles.nestedTd}>{formatDate(p.receivedOn)}</td>
                                        <td className={styles.nestedTd}>
                                          <span className={`${styles.status} ${p.receivedOn ? styles.received : styles.pending}`}>
                                            <span className={styles.dot}></span>
                                            {p.receivedOn ? "Delivered" : "In-Transit"}
                                          </span>
                                        </td>
                                        <td className={styles.nestedTd} style={{ textAlign: "center" }}>
                                          <div className={styles.actionGroup} style={{ justifyContent: "center" }}>
                                            {!isArchived && (
                                              <>
                                                <button className={styles.editBtn} onClick={() => openEditModal(p)} title="Edit record">
                                                  <Icon name="edit-inventory" size={14} />
                                                </button>
                                                <button className={styles.archiveBtn} onClick={() => openArchiveModal(p)} title="Archive this record">
                                                  <Icon name="archive-this-record" size={14} />
                                                </button>
                                              </>
                                            )}
                                            {isArchived && (
                                              <>
                                                <button className={styles.restoreBtn} onClick={() => openRestoreModal(p)} title="Restore record">
                                                  <Icon name="restore-invoice" size={14} />
                                                </button>
                                                <button className={styles.deleteBtn} onClick={() => openDeleteModal(p)} title="Delete permanently">
                                                  <Icon name="delete-permanently" size={14} />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── TABLE RENDERER: FLAT VIEW ────────────────────────────────────
  const renderFlatTable = (rows, isArchived = false) => (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Image</th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("orderedOn")}>Date Ordered <SortIcon columnKey="orderedOn" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("sellerId")}>Seller <SortIcon columnKey="sellerId" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("sellerProductId")}>Seller SKU <SortIcon columnKey="sellerProductId" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("inventoryId")}>Internal ID <SortIcon columnKey="inventoryId" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("quantity")}>Qty <SortIcon columnKey="quantity" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("price")}>Unit Price <SortIcon columnKey="price" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("finalUnitPrice")}>Final Unit Price <SortIcon columnKey="finalUnitPrice" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("total")}>Total <SortIcon columnKey="total" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("invoiceNo")}>Invoice No <SortIcon columnKey="invoiceNo" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("receivedOn")}>Received On <SortIcon columnKey="receivedOn" /></th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="13" className={styles.noData}>
                  {isArchived ? "No archived purchase records." : "No purchase records found matching your filters."}
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const finalUnitPrice = calculateFinalUnitPrice(p);
                return (
                  <tr key={p._id} className={`${styles.tr} ${isArchived ? styles.archivedRow : ""}`}>
                    <td className={styles.td}>
                      {p.imageUrl ? (
                        <div 
                          className={styles.imageWrapper}
                          onMouseEnter={(e) => handleImageMouseEnter(e, p)}
                          onMouseLeave={handleImageMouseLeave}
                        >
                          <img src={p.imageUrl} alt={p.inventoryId || "Item"} className={styles.itemImageThumbnail} />
                        </div>
                      ) : (
                        <div className={styles.imagePlaceholder}>NA</div>
                      )}
                    </td>
                    <td className={styles.td}>{formatDate(p.orderedOn)}</td>
                    <td className={`${styles.td} ${styles.sellerCell}`}>{p.sellerId?.businessName || "Unknown"}</td>
                    <td className={styles.td}>{p.sellerProductId}</td>
                    <td className={`${styles.td} ${styles.idCell}`}>{p.inventoryId}</td>
                    <td className={`${styles.td} ${styles.quantity}`}>{p.quantity}</td>
                    <td className={`${styles.td} ${styles.price}`}>₹{p.price.toFixed(2)}</td>
                    <td className={`${styles.td} ${styles.finalUnitPrice}`}>₹{finalUnitPrice.toFixed(2)}</td>
                    <td className={`${styles.td} ${styles.total}`}>₹{calculateTotal(p).toFixed(2)}</td>
                    <td className={styles.td}>{p.invoiceNo || "-"}</td>
                    <td className={styles.td}>{formatDate(p.receivedOn)}</td>
                  <td className={styles.td}>
                    <span className={`${styles.status} ${p.receivedOn ? styles.received : styles.pending}`}>
                      <span className={styles.dot}></span>
                      {p.receivedOn ? "Delivered" : "In-Transit"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionGroup}>
                      {!isArchived && (
                        <>
                          <button className={styles.editBtn} onClick={() => openEditModal(p)} title="Edit record">
                            <Icon name="edit-inventory" size={14} />
                          </button>
                          <button className={styles.archiveBtn} onClick={() => openArchiveModal(p)} title="Archive this record">
                            <Icon name="archive-this-record" size={14} />
                          </button>
                        </>
                      )}
                      {isArchived && (
                        <>
                          <button className={styles.restoreBtn} onClick={() => openRestoreModal(p)} title="Restore record">
                            <Icon name="restore-invoice" size={14} />
                          </button>
                          <button className={styles.deleteBtn} onClick={() => openDeleteModal(p)} title="Delete permanently">
                            <Icon name="delete-permanently" size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Purchase History</h1>
          <p className={styles.subtitle}>A complete log of all inbound stock and procurement expenses.</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <Icon name="icon-9c4a10ac" size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search SKU, Invoice, Seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Delivered">Delivered</option>
            <option value="In-Transit">In-Transit</option>
          </select>

          {/* View Mode Toggle: Grouped vs Flat */}
          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === "grouped" ? styles.viewToggleActive : ""}`}
              onClick={() => setViewMode("grouped")}
              title="Group by Seller & Invoice"
            >
              <Icon name="payment-qr-balance" size={14} />
              Grouped
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === "flat" ? styles.viewToggleActive : ""}`}
              onClick={() => setViewMode("flat")}
              title="Flat List View"
            >
              <Icon name="icon-5d77ebc6" size={14} />
              Flat List
            </button>
          </div>

          {/* Expand/Collapse All (Grouped Mode) */}
          {viewMode === "grouped" && processedGroups.length > 0 && (
            <button
              className={styles.actionSecondaryBtn}
              onClick={() => isAllExpanded(false) ? collapseAllGroups(false) : expandAllGroups(false)}
              title={isAllExpanded(false) ? "Collapse All Groups" : "Expand All Groups"}
            >
              <Icon name="icon-89725ea1" size={14} />
              {isAllExpanded(false) ? "Collapse All" : "Expand All"}
            </button>
          )}

          <button
            className={styles.downloadExcelBtn}
            onClick={exportGroupedToExcel}
            title="Download Grouped Purchase History Excel Sheet"
          >
            <Icon name="download-invoices-excel-report" size={15} />
            Download Excel
          </button>

          <button
            className={`${styles.showArchivedBtn} ${showArchived ? styles.showArchivedActive : ""}`}
            onClick={toggleShowArchived}
            title={showArchived ? "Hide archived records" : "Show archived records"}
          >
            <Icon name="archive-this-record" size={15} />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>

          <button className={styles.refreshBtn} onClick={fetchPurchases} title="Refresh Data">
            <Icon name="refresh-data" />
          </button>
        </div>
      </div>

      {/* ── Summary Stats Cards ───────────────────────────────────── */}
      {!loading && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
              <Icon name="pdf-preview" size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Invoices / Groups</span>
              <span className={styles.statValue}>{summaryStats.totalInvoices}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>
              <Icon name="icon-5d77ebc6" size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Line Items</span>
              <span className={styles.statValue}>{summaryStats.totalItems}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Icon name="icon-d0275ba0" size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Purchased Qty</span>
              <span className={styles.statValue}>{summaryStats.totalStockQty} units</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <Icon name="icon-7e710d4a" size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Procurement Cost</span>
              <span className={styles.statValue}>₹{summaryStats.totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable Table Area ───────────────────────────────── */}
      <div className={styles.scrollArea}>
        {loading ? (
          <div className={styles.tableWrapper}>
            <div className={styles.loadingWrapper}>
              <div className={styles.spinner}></div>
              <p>Fetching history logs...</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "grouped"
              ? renderGroupedTable(paginatedGroups, false)
              : renderFlatTable(paginatedFlatItems, false)
            }

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}

        {/* ── Archived Section ─────────────────────────────────────── */}
        {showArchived && (
          <div className={styles.archivedSection}>
            <div className={styles.archivedSectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className={styles.archivedSectionTitle}>
                  <Icon name="archive-this-record" size={16} />
                  Archived Records
                  <span className={styles.archivedCount}>{archivedPurchases.length}</span>
                </span>
                <p className={styles.archivedSectionSubtitle}>These records are soft-deleted. Use "Delete Permanently" to remove them forever.</p>
              </div>

              {viewMode === "grouped" && archivedProcessedGroups.length > 0 && (
                <button
                  className={styles.actionSecondaryBtn}
                  onClick={() => isAllExpanded(true) ? collapseAllGroups(true) : expandAllGroups(true)}
                >
                  {isAllExpanded(true) ? "Collapse All Archived" : "Expand All Archived"}
                </button>
              )}
            </div>

            {loadingArchived ? (
              <div className={styles.tableWrapper} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                <div className={styles.spinner} style={{ margin: "0 auto 1rem" }}></div>
                <p>Loading archived records...</p>
              </div>
            ) : (
              viewMode === "grouped"
                ? renderGroupedTable(archivedProcessedGroups, true)
                : renderFlatTable(archivedPurchases, true)
            )}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ─────────────────────────────────────────── */}
      {isEditing && editingData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Edit Purchase</h2>
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Date Ordered</label>
                <input type="date" name="orderedOn" value={editingData.orderedOn} onChange={handleEditChange} required />
              </div>
              <div className={styles.rowGroup}>
                <div className={styles.formGroup}>
                  <label>Quantity</label>
                  <input type="number" name="quantity" value={editingData.quantity} onChange={handleEditChange} min="1" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Unit Price (₹)</label>
                  <input type="number" name="price" value={editingData.price} onChange={handleEditChange} step="0.01" min="0" required />
                </div>
              </div>
              <div className={styles.rowGroup}>
                <div className={styles.formGroup}>
                  <label>Shipping Fee (₹)</label>
                  <input type="number" name="shippingFee" value={editingData.shippingFee} onChange={handleEditChange} step="0.01" min="0" />
                </div>
                <div className={styles.formGroup}>
                  <label>Tax (%)</label>
                  <input type="number" name="taxPercentage" value={editingData.taxPercentage} onChange={handleEditChange} step="0.1" min="0" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Invoice No</label>
                <input type="text" name="invoiceNo" value={editingData.invoiceNo} onChange={handleEditChange} placeholder="Enter Invoice No" />
              </div>
              <div className={styles.formGroup}>
                <label>Received On (Leave blank if In-Transit)</label>
                <input type="date" name="receivedOn" value={editingData.receivedOn} onChange={handleEditChange} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeEditModal} disabled={isSaving}>Cancel</button>
              <button className={styles.saveBtn} onClick={saveEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ARCHIVE CONFIRM MODAL ──────────────────────────────── */}
      {archiveTarget && (
        <div className={styles.modalOverlay} onClick={closeArchiveModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.dangerModalIcon}>
              <Icon name="archive-this-record" size={28} />
            </div>
            <h2 className={styles.modalTitle}>Archive Purchase Record</h2>
            <p className={styles.modalDesc}>
              You are about to archive the purchase of <strong>{archiveTarget.inventoryId}</strong> from <strong>{archiveTarget.sellerId?.businessName || "Unknown"}</strong>.
              <br />Archived records can be viewed and permanently deleted later.
            </p>
            <div className={styles.formGroup} style={{ marginTop: "1.25rem" }}>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Type <strong style={{ color: "#f59e0b" }}>archive</strong> to confirm
              </label>
              <input
                ref={archiveInputRef}
                type="text"
                className={styles.confirmInput}
                placeholder="Type 'archive' here..."
                value={archiveInput}
                onChange={e => setArchiveInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && archiveInput.trim().toLowerCase() === "archive" && confirmArchive()}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeArchiveModal} disabled={isArchiving}>Cancel</button>
              <button
                className={styles.archiveConfirmBtn}
                onClick={confirmArchive}
                disabled={isArchiving || archiveInput.trim().toLowerCase() !== "archive"}
              >
                {isArchiving ? "Archiving..." : "Archive Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESTORE CONFIRM MODAL ──────────────────────────────── */}
      {restoreTarget && (
        <div className={styles.modalOverlay} onClick={closeRestoreModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={`${styles.dangerModalIcon} ${styles.infoBlue}`}>
              <Icon name="restore-invoice" size={28} />
            </div>
            <h2 className={styles.modalTitle}>Restore Purchase Record</h2>
            <p className={styles.modalDesc}>
              You are about to restore the purchase of <strong>{restoreTarget.inventoryId}</strong> from <strong>{restoreTarget.sellerId?.businessName || "Unknown"}</strong>.
            </p>
            <div className={styles.formGroup} style={{ marginTop: "1.25rem" }}>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Type <strong style={{ color: "#3b82f6" }}>restore</strong> to confirm
              </label>
              <input
                ref={restoreInputRef}
                type="text"
                className={styles.confirmInput}
                placeholder="Type 'restore' here..."
                value={restoreInput}
                onChange={e => setRestoreInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && restoreInput.trim().toLowerCase() === "restore" && confirmRestore()}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeRestoreModal} disabled={isRestoring}>Cancel</button>
              <button
                className={styles.restoreConfirmBtn}
                onClick={confirmRestore}
                disabled={isRestoring || restoreInput.trim().toLowerCase() !== "restore"}
              >
                {isRestoring ? "Restoring..." : "Restore Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE PERMANENTLY MODAL (PIN) ─────────────────────── */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={`${styles.dangerModalIcon} ${styles.dangerRed}`}>
              <Icon name="delete-permanently" size={28} />
            </div>
            <h2 className={styles.modalTitle}>Delete Permanently</h2>
            <p className={styles.modalDesc}>
              This will <strong style={{ color: "#ef4444" }}>permanently</strong> remove the purchase record for <strong>{deleteTarget.inventoryId}</strong>. This action cannot be undone.
            </p>
            <div className={styles.formGroup} style={{ marginTop: "1.25rem" }}>
              <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Enter your login PIN to confirm</label>
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                maxLength={6}
                className={`${styles.confirmInput} ${pinError ? styles.confirmInputError : ""}`}
                placeholder="Enter your PIN..."
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(""); }}
                onKeyDown={e => e.key === "Enter" && confirmDelete()}
              />
              {pinError && <span className={styles.pinError}>{pinError}</span>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeDeleteModal} disabled={isDeleting}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDelete} disabled={isDeleting || !pinInput}>
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}


      {hoveredImage && (
        <div 
          className={styles.floatingImagePreview} 
          style={{ top: `${hoveredImage.top}px`, left: `${hoveredImage.left}px` }}
        >
          <div className={styles.floatingPreviewCard}>
            <img src={hoveredImage.url} alt={hoveredImage.title} className={styles.floatingPreviewImg} />
            <div className={styles.floatingPreviewTitle}>{hoveredImage.title}</div>
          </div>
        </div>
      )}
    </div>
  );
}
