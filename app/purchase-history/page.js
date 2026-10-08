"use client";
import { toast } from "sonner";



import React, { useState, useEffect, useMemo, useRef } from "react";
import PageShell from "@/components/ui/PageShell/PageShell";

import { parseSearchQuery, matchesArraySearchTerms } from "../../utils/searchUtils";
import * as XLSX from "xlsx";
import { calculateTotal, calculateFinalUnitPrice, groupPurchases, toInputDate } from "./purchaseHistoryUtils";
import { buildPurchaseHistoryWorkbook } from "./purchaseHistoryExport";
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

    const workbook = buildPurchaseHistoryWorkbook(targetGroups, targetItems, showArchived);

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
        setPurchases(prev => prev.map(p => p._id === result.data._id ? result.data : p));
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
  const renderGroupedTable = (groups, isArchived = false, isLoading = false) => (
    <GroupedTable
      groups={groups}
      isArchived={isArchived}
      loading={isLoading}
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
  const renderFlatTable = (rows, isArchived = false, isLoading = false) => (
    <FlatTable
      rows={rows}
      isArchived={isArchived}
      loading={isLoading}
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
    <PageShell>
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
        refreshing={loading}
        onRefresh={fetchPurchases}
      />

      {!loading && <SummaryStats stats={summaryStats} />}

      {viewMode === "grouped"
        ? renderGroupedTable(paginatedGroups, false, loading)
        : renderFlatTable(paginatedFlatItems, false, loading)
      }

      {!loading && totalPages > 1 && (
        <PurchasePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
        />
      )}

      {showArchived && (
        <ArchivedSection
          count={archivedPurchases.length}
          showExpandToggle={viewMode === "grouped" && archivedProcessedGroups.length > 0}
          allExpanded={isAllExpanded(true)}
          onToggleExpandAll={toggleExpandAllArchived}
        >
          {viewMode === "grouped"
            ? renderGroupedTable(archivedProcessedGroups, true, loadingArchived)
            : renderFlatTable(archivedPurchases, true, loadingArchived)
          }
        </ArchivedSection>
      )}

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
    </PageShell>
  );
}
