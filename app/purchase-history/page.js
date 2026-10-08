"use client";
import { toast } from "sonner";



import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "./page.module.css";

import { parseSearchQuery, matchesArraySearchTerms } from "../../utils/searchUtils";
import * as XLSX from "xlsx";
import { calculateTotal, calculateFinalUnitPrice, groupPurchases, formatDate, toInputDate } from "./purchaseHistoryUtils";
import PurchaseToolbar from "./_components/PurchaseToolbar/PurchaseToolbar";
import SummaryStats from "./_components/SummaryStats/SummaryStats";
import GroupedTable from "./_components/GroupedTable/GroupedTable";
import FlatTable from "./_components/FlatTable/FlatTable";
import PurchasePagination from "./_components/PurchasePagination/PurchasePagination";
import ArchivedSection from "./_components/ArchivedSection/ArchivedSection";
import ImagePreviewPopover from "./_components/ImagePreviewPopover/ImagePreviewPopover";
import EditPurchaseModal from "./_components/EditPurchaseModal/EditPurchaseModal";
import ConfirmModal from "./_components/ConfirmModal/ConfirmModal";

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

  // ── Inline JSX handlers moved to named handlers (identical bodies) ──
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const toggleExpandAllActive = () => isAllExpanded(false) ? collapseAllGroups(false) : expandAllGroups(false);
  const toggleExpandAllArchived = () => isAllExpanded(true) ? collapseAllGroups(true) : expandAllGroups(true);
  const goToPrevPage = () => setCurrentPage(p => p - 1);
  const goToNextPage = () => setCurrentPage(p => p + 1);
  const handleArchiveInputChange = e => setArchiveInput(e.target.value);
  const handleArchiveKeyDown = e => e.key === "Enter" && archiveInput.trim().toLowerCase() === "archive" && confirmArchive();
  const handleRestoreInputChange = e => setRestoreInput(e.target.value);
  const handleRestoreKeyDown = e => e.key === "Enter" && restoreInput.trim().toLowerCase() === "restore" && confirmRestore();
  const handlePinInputChange = e => { setPinInput(e.target.value); setPinError(""); };
  const handlePinKeyDown = e => e.key === "Enter" && confirmDelete();

  // ── TABLE RENDERER: GROUPED VIEW ─────────────────────────────────
  const renderGroupedTable = (groups, isArchived = false) => (
    <GroupedTable
      groups={groups}
      isArchived={isArchived}
      expandedGroups={isArchived ? archivedExpandedGroups : expandedGroups}
      sortConfig={sortConfig}
      onSort={handleSort}
      onToggleGroup={toggleGroupExpand}
      onCopy={copyToClipboard}
      onImageMouseEnter={handleImageMouseEnter}
      onImageMouseLeave={handleImageMouseLeave}
      onEdit={openEditModal}
      onArchive={openArchiveModal}
      onRestore={openRestoreModal}
      onDelete={openDeleteModal}
    />
  );

  // ── TABLE RENDERER: FLAT VIEW ────────────────────────────────────
  const renderFlatTable = (rows, isArchived = false) => (
    <FlatTable
      rows={rows}
      isArchived={isArchived}
      sortConfig={sortConfig}
      onSort={handleSort}
      onImageMouseEnter={handleImageMouseEnter}
      onImageMouseLeave={handleImageMouseLeave}
      onEdit={openEditModal}
      onArchive={openArchiveModal}
      onRestore={openRestoreModal}
      onDelete={openDeleteModal}
    />
  );

  return (
    <div className={styles.container}>
      <PurchaseToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showExpandToggle={viewMode === "grouped" && processedGroups.length > 0}
        allExpanded={isAllExpanded(false)}
        onToggleExpandAll={toggleExpandAllActive}
        onExport={exportGroupedToExcel}
        showArchived={showArchived}
        onToggleShowArchived={toggleShowArchived}
        onRefresh={fetchPurchases}
      />

      {/* ── Summary Stats Cards ───────────────────────────────────── */}
      {!loading && <SummaryStats stats={summaryStats} />}

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
              <PurchasePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={goToPrevPage}
                onNext={goToNextPage}
              />
            )}
          </>
        )}

        {/* ── Archived Section ─────────────────────────────────────── */}
        {showArchived && (
          <ArchivedSection
            count={archivedPurchases.length}
            showExpandToggle={viewMode === "grouped" && archivedProcessedGroups.length > 0}
            allExpanded={isAllExpanded(true)}
            onToggleExpandAll={toggleExpandAllArchived}
          >
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
          </ArchivedSection>
        )}
      </div>

      {/* ── EDIT MODAL ─────────────────────────────────────────── */}
      {isEditing && editingData && (
        <EditPurchaseModal
          editingData={editingData}
          isSaving={isSaving}
          onChange={handleEditChange}
          onCancel={closeEditModal}
          onSave={saveEdit}
        />
      )}

      {/* ── ARCHIVE CONFIRM MODAL ──────────────────────────────── */}
      {archiveTarget && (
        <ConfirmModal
          kind="archive"
          target={archiveTarget}
          inputRef={archiveInputRef}
          inputValue={archiveInput}
          onInputChange={handleArchiveInputChange}
          onInputKeyDown={handleArchiveKeyDown}
          isBusy={isArchiving}
          confirmDisabled={isArchiving || archiveInput.trim().toLowerCase() !== "archive"}
          onClose={closeArchiveModal}
          onConfirm={confirmArchive}
        />
      )}

      {/* ── RESTORE CONFIRM MODAL ──────────────────────────────── */}
      {restoreTarget && (
        <ConfirmModal
          kind="restore"
          target={restoreTarget}
          inputRef={restoreInputRef}
          inputValue={restoreInput}
          onInputChange={handleRestoreInputChange}
          onInputKeyDown={handleRestoreKeyDown}
          isBusy={isRestoring}
          confirmDisabled={isRestoring || restoreInput.trim().toLowerCase() !== "restore"}
          onClose={closeRestoreModal}
          onConfirm={confirmRestore}
        />
      )}

      {/* ── DELETE PERMANENTLY MODAL (PIN) ─────────────────────── */}
      {deleteTarget && (
        <ConfirmModal
          kind="delete"
          target={deleteTarget}
          inputRef={pinInputRef}
          inputValue={pinInput}
          onInputChange={handlePinInputChange}
          onInputKeyDown={handlePinKeyDown}
          error={pinError}
          isBusy={isDeleting}
          confirmDisabled={isDeleting || !pinInput}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      )}


      {hoveredImage && <ImagePreviewPopover image={hoveredImage} />}
    </div>
  );
}
