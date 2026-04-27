"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

// All available columns
const ALL_COLUMNS = [
    { key: "timestamp", label: "Record Date" },
    { key: "orderId", label: "Order ID" },
    { key: "lineId", label: "Line ID" },
    { key: "skuId", label: "SKU ID" },
    { key: "quantity", label: "Qty" },
    { key: "status", label: "Status" },
];

const DEFAULT_VISIBLE = ["timestamp", "orderId", "lineId", "skuId", "quantity", "status"];
const ALL_STATUSES = ["ORDERED", "DISPATCHED", "CANCELLED", "CANCELLED_BEFORE_PICKUP", "RETURNED", "DELIVERED"];

export default function SalesRecordsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Core data
    const [allRecords, setAllRecords] = useState([]);

    // Filtering & Sorting State (drive server-side fetch)
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState([]);
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");

    // Dynamic Columns State
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const initial = {};
        ALL_COLUMNS.forEach(c => initial[c.key] = DEFAULT_VISIBLE.includes(c.key));
        return initial;
    });
    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(500);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Bulk Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editedRows, setEditedRows] = useState({});
    const [updating, setUpdating] = useState(false);

    // Debounce timer for search
    const searchTimerRef = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const colMenuRef = useRef(null);
    const statusMenuRef = useRef(null);

    // Click outside to close menus
    useEffect(() => {
        function handleClickOutside(event) {
            if (colMenuRef.current && !colMenuRef.current.contains(event.target)) setIsColMenuOpen(false);
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) setIsStatusMenuOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce search input
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(searchTimerRef.current);
    }, [searchQuery]);

    // Reset to page 1 when filters/sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, sortBy, sortOrder, pageSize]);

    // ── Server-Side Fetch ──────────────────────────────────────────────────
    const fetchSalesRecords = useCallback(async (opts = {}) => {
        const isRefresh = opts.forceRefresh === true;

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const params = new URLSearchParams({
            page: String(opts.page ?? currentPage),
            pageSize: String(opts.pageSize ?? pageSize),
            sortBy,
            sortOrder,
        });

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (statusFilter.length > 0) params.set("status", statusFilter.join(","));

        try {
            const res = await fetch(`/api/employee/sales-records?${params.toString()}`);
            const response = await res.json();

            if (res.ok && response.success) {
                setAllRecords(response.data || []);
                setTotalItems(response.totalItems || 0);
                setTotalPages(response.totalPages || 1);
                if (isRefresh) setMessage({ text: "Records refreshed.", type: "success" });
            } else {
                setMessage({ text: response.error || "Failed to load records.", type: "error" });
            }
        } catch {
            setMessage({ text: "Network error fetching records.", type: "error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, pageSize, sortBy, sortOrder, debouncedSearch, statusFilter]);

    // Re-fetch whenever page/sort/filter/search changes
    useEffect(() => {
        fetchSalesRecords();
    }, [fetchSalesRecords]);

    // ── Handlers ────────────────────────────────────────────────────────
    const handleRefresh = () => {
        if (Object.keys(editedRows).length > 0) {
            if (!confirm("You have unsaved changes. Refresh anyway?")) return;
        }
        setEditedRows({});
        fetchSalesRecords({ forceRefresh: true });
    };

    const handleCellChange = (orderId, lineId, field, value) => {
        const rowKey = `${orderId}|${lineId}`;
        setEditedRows(prev => ({
            ...prev,
            [rowKey]: {
                ...(prev[rowKey] || {}),
                orderId,
                lineId,
                [field]: value,
            },
        }));
    };

    const handleBulkUpdate = async () => {
        const updates = Object.values(editedRows);

        if (updates.length === 0) {
            setIsEditing(false);
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch("/api/employee/sales-records", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            });
            const response = await res.json();

            if (res.ok && response.success) {
                setMessage({ text: `Successfully updated ${response.modifiedCount} records.`, type: "success" });
                setEditedRows({});
                setIsEditing(false);
                fetchSalesRecords({ forceRefresh: true });
            } else {
                setMessage({ text: response.error || "Bulk update failed.", type: "error" });
            }
        } catch {
            setMessage({ text: "Network error during bulk update.", type: "error" });
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        if (Object.keys(editedRows).length > 0) {
            if (!confirm("Discard all changes?")) return;
        }
        setEditedRows({});
        setIsEditing(false);
    };

    const toggleColumn = (key) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleStatusFilter = (status) => {
        setStatusFilter(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    // ── Render Helpers ──────────────────────────────────────────────────
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-IN", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
            });
        } catch { return dateStr; }
    };

    const statusClass = (status) => {
        switch ((status || "").toUpperCase()) {
            case "DISPATCHED": return styles.badgeBlue;
            case "DELIVERED": return styles.badgeGreen;
            case "CANCELLED": return styles.badgeRed;
            case "RETURNED": return styles.badgeOrange;
            case "CANCELLED_BEFORE_PICKUP": return styles.badgeOrange;
            default: return styles.badgeGray;
        }
    };

    const renderCellContent = (key, rec) => {
        const rowKey = `${rec.orderId}|${rec.lineId}`;
        const isEdited = editedRows[rowKey] && editedRows[rowKey][key] !== undefined;
        const displayValue = isEdited ? editedRows[rowKey][key] : rec[key];

        if (key === "status") {
            if (isEditing) {
                return (
                    <select
                        className={`${styles.cellSelect} ${isEdited ? styles.editedCell : ""}`}
                        value={displayValue || ""}
                        onChange={(e) => handleCellChange(rec.orderId, rec.lineId, key, e.target.value)}
                    >
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                );
            }
            return <span className={`${styles.badge} ${statusClass(displayValue)}`}>{displayValue}</span>;
        }

        if (key === "timestamp") return <span className={styles.dateText}>{formatDate(displayValue)}</span>;
        if (key === "orderId") return <span className={styles.highlightText}>{displayValue || "N/A"}</span>;
        if (key === "skuId") return <span className={styles.skuText}>{displayValue}</span>;

        return displayValue || <span className={styles.na}>—</span>;
    };

    // ────────────────────────────────────────────────────────────────────
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sales Records</h1>

                <div className={styles.filtersRow}>

                    {/* Search */}
                    <div className={styles.searchWrapper}>
                        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search Order, Line or SKU…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className={styles.dropdownContainer} ref={statusMenuRef}>
                        <button className={styles.dropdownBtn} onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}>
                            Status Filter {statusFilter.length > 0 && <span className={styles.badgeCount}>{statusFilter.length}</span>}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        {isStatusMenuOpen && (
                            <div className={styles.dropdownMenu}>
                                {ALL_STATUSES.map(status => (
                                    <label key={status} className={styles.dropdownItem}>
                                        <input
                                            type="checkbox"
                                            checked={statusFilter.includes(status)}
                                            onChange={() => toggleStatusFilter(status)}
                                            className={styles.dropdownCheckbox}
                                        />
                                        {status}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Visible Columns Dropdown */}
                    <div className={styles.dropdownContainer} ref={colMenuRef}>
                        <button className={styles.dropdownBtn} onClick={() => setIsColMenuOpen(!isColMenuOpen)}>
                            Columns
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        {isColMenuOpen && (
                            <div className={styles.dropdownMenu}>
                                {ALL_COLUMNS.map(c => (
                                    <label key={c.key} className={styles.dropdownItem}>
                                        <input
                                            type="checkbox"
                                            checked={!!visibleColumns[c.key]}
                                            onChange={() => toggleColumn(c.key)}
                                            className={styles.dropdownCheckbox}
                                        />
                                        {c.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort By */}
                    <select className={styles.filterSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        {ALL_COLUMNS.map(c => (
                            <option key={`sort-${c.key}`} value={c.key}>Sort: {c.label}</option>
                        ))}
                    </select>

                    {/* Sort Order */}
                    <select className={styles.filterSelect} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>

                    {/* Edit Toggles */}
                    {!isEditing ? (
                        <button className={styles.editRecordsBtn} onClick={() => setIsEditing(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                            Edit Records
                        </button>
                    ) : (
                        <div className={styles.editControls}>
                            <button
                                className={`${styles.updateBtn} ${updating ? styles.updating : ""}`}
                                onClick={handleBulkUpdate}
                                disabled={updating}
                            >
                                {updating ? (
                                    <>
                                        <div className={styles.miniSpinner}></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        Save Changes {Object.keys(editedRows).length > 0 && `(${Object.keys(editedRows).length})`}
                                    </>
                                )}
                            </button>
                            <button className={styles.cancelBtn} onClick={handleCancelEdit} disabled={updating}>
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Refresh */}
                    <button className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`} onClick={handleRefresh} disabled={refreshing || updating} title="Fetch Latest Data">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                <div className={styles.scrollWrapper}>
                    <div className={styles.tableContainer}>
                        {loading ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner}></div>
                                <p>Loading records…</p>
                            </div>
                        ) : allRecords.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {ALL_COLUMNS.filter(c => visibleColumns[c.key]).map(c => (
                                            <th key={`th-${c.key}`}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }} onClick={() => { if (sortBy === c.key) setSortOrder(sortOrder === "asc" ? "desc" : "asc"); else { setSortBy(c.key); setSortOrder("desc"); } }}>
                                                    {c.label}
                                                    {sortBy === c.key && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            {sortOrder === "desc" ? <polyline points="6 9 12 15 18 9"></polyline> : <polyline points="18 15 12 9 6 15"></polyline>}
                                                        </svg>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {allRecords.map((rec, index) => (
                                        <tr key={`row-${rec.orderId}-${rec.lineId}-${index}`}>
                                            {ALL_COLUMNS.filter(c => visibleColumns[c.key]).map(c => (
                                                <td key={`td-${c.key}-${index}`}>
                                                    {renderCellContent(c.key, rec)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>No matching records found.</div>
                        )}
                    </div>
                </div>

                {!loading && totalItems > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationLeft}>
                            <span className={styles.pageInfo}>
                                Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                            </span>

                            <div className={styles.pageSizeWrapper}>
                                <label htmlFor="pageSizeSelect" className={styles.pageSizeLabel}>Rows per page:</label>
                                <select
                                    id="pageSizeSelect"
                                    className={styles.pageSizeSelect}
                                    value={pageSize}
                                    onChange={e => setPageSize(Number(e.target.value))}
                                >
                                    {[100, 250, 500, 1000, 2000, 5000].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.pageControls}>
                            <button className={styles.pageBtn} disabled={currentPage === 1 || loading}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                                Previous
                            </button>
                            <span className={styles.pageDisplay}>Page {currentPage} of {totalPages}</span>
                            <button className={styles.pageBtn} disabled={currentPage >= totalPages || loading}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Toast message={message} onClose={() => setMessage({ text: "", type: "" })} />
        </div>
    );
}
