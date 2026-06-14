"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function PurchaseHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);

  // Show archived toggle
  const [showArchived, setShowArchived] = useState(false);
  const [archivedPurchases, setArchivedPurchases] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

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

  const [message, setMsg] = useState({ text: "", type: "" });

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
        setMsg({ text: result.error || "Failed to load purchase history", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error loading history", type: "error" });
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
        setMsg({ text: result.error || "Failed to load archived records", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error loading archived records", type: "error" });
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
        // Refresh archived list if it's visible
        if (showArchived) fetchArchivedPurchases();
        setMsg({ text: "Purchase archived successfully.", type: "success" });
        closeArchiveModal();
      } else {
        setMsg({ text: result.error || "Failed to archive", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error. Try again.", type: "error" });
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
        // We do not have auto-refresh of active purchases here to avoid heavy fetch
        // but let's re-fetch the active ones so the restored item appears.
        fetchPurchases();
        setMsg({ text: "Purchase restored successfully.", type: "success" });
        closeRestoreModal();
      } else {
        setMsg({ text: result.error || "Failed to restore", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error. Try again.", type: "error" });
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
        setMsg({ text: "Purchase permanently deleted.", type: "success" });
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

  // ── Edit flow ───────────────────────────────────────────────────
  const calculateTotal = (p) => {
    const subtotal = p.quantity * p.price;
    const taxAmount = (subtotal * (p.taxPercentage || 0)) / 100;
    return subtotal + (p.shippingFee || 0) + taxAmount;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const processedPurchases = useMemo(() => {
    let filtered = purchases;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.inventoryId?.toLowerCase().includes(q) ||
        p.invoiceNo?.toLowerCase().includes(q) ||
        p.sellerId?.businessName?.toLowerCase().includes(q) ||
        p.sellerProductId?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter(p => {
        const isDelivered = !!p.receivedOn;
        if (statusFilter === "Delivered") return isDelivered;
        if (statusFilter === "In-Transit") return !isDelivered;
        return true;
      });
    }
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "sellerId") { aValue = a.sellerId?.businessName || ""; bValue = b.sellerId?.businessName || ""; }
      else if (sortConfig.key === "total") { aValue = calculateTotal(a); bValue = calculateTotal(b); }
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [purchases, searchQuery, statusFilter, sortConfig]);

  const totalPages = Math.ceil(processedPurchases.length / itemsPerPage);
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedPurchases.slice(start, start + itemsPerPage);
  }, [processedPurchases, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

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
        setMsg({ text: "Purchase updated successfully!", type: "success" });
        closeEditModal();
      } else {
        setMsg({ text: result.error || "Failed to update purchase", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error saving purchase", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className={styles.sortPlaceholder}>↕</span>;
    return <span className={styles.sortActive}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  // ── TABLE RENDERER (shared for active & archived) ────────────────
  const renderTable = (rows, isArchived = false) => (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("orderedOn")}>Date Ordered <SortIcon columnKey="orderedOn" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("sellerId")}>Seller <SortIcon columnKey="sellerId" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("sellerProductId")}>Seller SKU <SortIcon columnKey="sellerProductId" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("inventoryId")}>Internal ID <SortIcon columnKey="inventoryId" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("quantity")}>Qty <SortIcon columnKey="quantity" /></th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("price")}>Unit Price <SortIcon columnKey="price" /></th>
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
                <td colSpan="11" className={styles.noData}>
                  {isArchived ? "No archived purchase records." : "No purchase records found matching your filters."}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p._id} className={`${styles.tr} ${isArchived ? styles.archivedRow : ""}`}>
                  <td className={styles.td}>{formatDate(p.orderedOn)}</td>
                  <td className={`${styles.td} ${styles.sellerCell}`}>{p.sellerId?.businessName || "Unknown"}</td>
                  <td className={styles.td}>{p.sellerProductId}</td>
                  <td className={`${styles.td} ${styles.idCell}`}>{p.inventoryId}</td>
                  <td className={`${styles.td} ${styles.quantity}`}>{p.quantity}</td>
                  <td className={`${styles.td} ${styles.price}`}>₹{p.price.toFixed(2)}</td>
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className={styles.archiveBtn} onClick={() => openArchiveModal(p)} title="Archive this record">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="21 8 21 21 3 21 3 8"></polyline>
                              <rect x="1" y="3" width="22" height="5"></rect>
                              <line x1="10" y1="12" x2="14" y2="12"></line>
                            </svg>
                          </button>
                        </>
                      )}
                      {isArchived && (
                        <>
                          <button className={styles.restoreBtn} onClick={() => openRestoreModal(p)} title="Restore record">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10"></polyline>
                              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                            </svg>
                          </button>
                          <button className={styles.deleteBtn} onClick={() => openDeleteModal(p)} title="Delete permanently">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6l-1 14H6L5 6"></path>
                              <path d="M10 11v6"></path>
                              <path d="M14 11v6"></path>
                              <path d="M9 6V4h6v2"></path>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
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
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by SKU, Invoice, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Delivered">Delivered</option>
            <option value="In-Transit">In-Transit</option>
          </select>
          <button
            className={`${styles.showArchivedBtn} ${showArchived ? styles.showArchivedActive : ""}`}
            onClick={toggleShowArchived}
            title={showArchived ? "Hide archived records" : "Show archived records"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <rect x="1" y="3" width="22" height="5"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
          <button className={styles.refreshBtn} onClick={fetchPurchases} title="Refresh Data">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Active purchases table */}
      {loading ? (
        <div className={styles.tableWrapper}>
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p>Fetching history logs...</p>
          </div>
        </div>
      ) : (
        <>
          {renderTable(paginatedPurchases, false)}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
              <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
              <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Archived section */}
      {showArchived && (
        <div className={styles.archivedSection}>
          <div className={styles.archivedSectionHeader}>
            <span className={styles.archivedSectionTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
              Archived Records
              <span className={styles.archivedCount}>{archivedPurchases.length}</span>
            </span>
            <p className={styles.archivedSectionSubtitle}>These records are soft-deleted. Use "Delete Permanently" to remove them forever.</p>
          </div>
          {loadingArchived ? (
            <div className={styles.tableWrapper} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              <div className={styles.spinner} style={{ margin: "0 auto 1rem" }}></div>
              <p>Loading archived records...</p>
            </div>
          ) : (
            renderTable(archivedPurchases, true)
          )}
        </div>
      )}

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
                  <label>Unit Price</label>
                  <input type="number" name="price" value={editingData.price} onChange={handleEditChange} step="0.01" min="0" required />
                </div>
              </div>
              <div className={styles.rowGroup}>
                <div className={styles.formGroup}>
                  <label>Shipping Fee</label>
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path><path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
              </svg>
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

      <Toast message={message} onClose={() => setMsg({ text: "", type: "" })} />
    </div>
  );
}
