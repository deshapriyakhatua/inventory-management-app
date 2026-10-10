"use client";
import { useState, useEffect, useMemo } from "react";
import { parseSearchQuery, matchesArraySearchTerms } from "@/utils/searchUtils";
import { calculateTotal, calculateFinalUnitPrice, groupPurchases } from "@/app/purchase-history/purchaseHistoryUtils";

// View state: view mode, filters, sorting, derived groups/stats, pagination, expand/collapse.
export default function usePurchaseView({ purchases, archivedPurchases }) {
  // View Mode: 'grouped' (default) vs 'flat'
  const [viewMode, setViewMode] = useState("grouped");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [archivedExpandedGroups, setArchivedExpandedGroups] = useState({});

  // Filtering & Pagination & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [sortConfig, setSortConfig] = useState({ key: "orderedOn", direction: "desc" });

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

  // Moved verbatim from page.js (where the compiler lint bailed out on the whole component).
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // ── Inline JSX handlers moved to named handlers (identical bodies) ──
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const toggleExpandAllActive = () => isAllExpanded(false) ? collapseAllGroups(false) : expandAllGroups(false);
  const toggleExpandAllArchived = () => isAllExpanded(true) ? collapseAllGroups(true) : expandAllGroups(true);
  const goToPrevPage = () => setCurrentPage(p => p - 1);
  const goToNextPage = () => setCurrentPage(p => p + 1);

  return {
    viewMode,
    setViewMode,
    expandedGroups,
    archivedExpandedGroups,
    searchQuery,
    statusFilter,
    currentPage,
    sortConfig,
    handleSort,
    filteredItems,
    processedGroups,
    summaryStats,
    archivedProcessedGroups,
    totalPages,
    paginatedGroups,
    paginatedFlatItems,
    toggleGroupExpand,
    isAllExpanded,
    handleSearchChange,
    handleStatusFilterChange,
    toggleExpandAllActive,
    toggleExpandAllArchived,
    goToPrevPage,
    goToNextPage,
  };
}
