"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

// All available columns
const ALL_COLUMNS = [
    { key: "timestamp",    label: "Record Date" },
    { key: "orderId",      label: "Order ID" },
    { key: "lineId",       label: "Line ID" },
    { key: "skuId",        label: "SKU ID" },
    { key: "quantity",     label: "Qty" },
    { key: "orderDate",    label: "Order Date" },
    { key: "dispatchDate", label: "Dispatch Date" },
    { key: "cancelDate",   label: "Cancel Date" },
    { key: "returnDate",   label: "Return Date" },
    { key: "deliveryDate", label: "Delivery Date" },
    { key: "returnDeliveryDate", label: "Return Delivery" },
    { key: "status",       label: "Status" },
];

const DEFAULT_VISIBLE = ["timestamp", "orderId", "lineId", "skuId", "quantity", "orderDate", "dispatchDate", "status"];
const CACHE_MINUTES = 10;
const EDITABLE_FIELDS = ["status", "dispatchDate", "cancelDate", "returnDate", "deliveryDate", "returnDeliveryDate"];

export default function SalesRecordsPage() {
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage]       = useState({ text: "", type: "" });
    
    // Core data
    const [allRecords, setAllRecords] = useState([]);

    // Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState([]); // array of statuses
    const [sortBy, setSortBy]           = useState("timestamp");
    const [sortOrder, setSortOrder]     = useState("desc");
    
    // Dynamic Columns State
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const initial = {};
        ALL_COLUMNS.forEach(c => initial[c.key] = DEFAULT_VISIBLE.includes(c.key));
        return initial;
    });
    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize]       = useState(20);

    // Bulk Edit State
    const [isEditing, setIsEditing]   = useState(false);
    const [editedRows, setEditedRows] = useState({});
    const [updating, setUpdating]     = useState(false);
    
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

    // ── Fetch & Cache ──────────────────────────────────────────────────
    const fetchSalesRecords = useCallback(async (forceRefresh = false) => {
        const pin = sessionStorage.getItem("app_pin");
        
        // Check cache first
        if (!forceRefresh) {
            const cachedData = localStorage.getItem("sales_records_cache");
            const cacheTime = localStorage.getItem("sales_records_cache_time");
            
            if (cachedData && cacheTime) {
                const ageMinutes = (new Date().getTime() - parseInt(cacheTime)) / (1000 * 60);
                if (ageMinutes < CACHE_MINUTES) {
                    try {
                        setAllRecords(JSON.parse(cachedData));
                        setLoading(false);
                        return;
                    } catch (e) { console.error("Cache parse error", e); }
                }
            }
        }

        if (forceRefresh) setRefreshing(true);
        else setLoading(true);

        const payload = {
            pin,
            action: "getSalesLog",
            page: 1,
            pageSize: 50000, 
            sortBy: "timestamp",
            sortOrder: "desc"
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
            }).then(r => r.json());

            if (response.status === 200 && response.data) {
                const sales = response.data.sales || [];
                setAllRecords(sales);
                
                // Set cache
                localStorage.setItem("sales_records_cache", JSON.stringify(sales));
                localStorage.setItem("sales_records_cache_time", new Date().getTime().toString());
                
                if (forceRefresh) setMessage({ text: "Records refreshed and cached.", type: "success" });
            } else {
                setMessage({ text: response.message || "Failed to load records.", type: "error" });
            }
        } catch {
            setMessage({ text: "Network error fetching records.", type: "error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => { fetchSalesRecords(false); }, [fetchSalesRecords]);

    // ── Client-Side Processing ──────────────────────────────────────────
    
    // All unique statuses in the dataset for the filter dropdown
    const availableStatuses = useMemo(() => {
        const stSet = new Set(allRecords.map(r => r.status).filter(Boolean));
        return Array.from(stSet).sort();
    }, [allRecords]);

    const processedRecords = useMemo(() => {
        let result = [...allRecords];

        // 1. Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r => 
                (r.orderId && r.orderId.toLowerCase().includes(q)) ||
                (r.lineId && r.lineId.toLowerCase().includes(q)) ||
                (r.skuId && String(r.skuId).toLowerCase().includes(q))
            );
        }

        // 2. Status Filter
        if (statusFilter.length > 0) {
            result = result.filter(r => statusFilter.includes(r.status));
        }

        // 3. Sort
        result.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (valA === null || valA === undefined || valA === "") valA = 0;
            if (valB === null || valB === undefined || valB === "") valB = 0;
            
            // Handle custom DD/MM/YYYY date formats from the backend (like returnDeliveryDate)
            const parseDateStr = (dateStr) => {
                if (typeof dateStr === 'string') {
                    // Try DD/MM/YYYY
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                    }
                }
                const d = new Date(dateStr);
                return isNaN(d) ? 0 : d.getTime();
            };

            // Heuristic to check if column is a date column (based on our ALL_COLUMNS key names)
            if (sortBy.toLowerCase().includes('date') || sortBy === 'timestamp') {
                if (valA !== 0) valA = parseDateStr(valA);
                if (valB !== 0) valB = parseDateStr(valB);
            } 
            else if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (sortOrder === "asc") return valA > valB ? 1 : valA < valB ? -1 : 0;
            else                     return valA < valB ? 1 : valA > valB ? -1 : 0;
        });

        return result;
    }, [allRecords, searchQuery, statusFilter, sortBy, sortOrder]);

    const totalItems = processedRecords.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedRecords = processedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset pagination when filters change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, sortBy, sortOrder, pageSize]);

    // ── Handlers ────────────────────────────────────────────────────────
    const handleRefresh = () => {
        if (Object.keys(editedRows).length > 0) {
            if (!confirm("You have unsaved changes. Refresh anyway?")) return;
        }
        setEditedRows({});
        fetchSalesRecords(true);
    };

    const handleCellChange = (orderId, lineId, field, value) => {
        const rowKey = `${orderId}|${lineId}`;
        setEditedRows(prev => ({
            ...prev,
            [rowKey]: {
                ...(prev[rowKey] || {}),
                orderId,
                lineId,
                [field]: value
            }
        }));
    };

    const handleBulkUpdate = async () => {
        const pin = sessionStorage.getItem("app_pin");
        const updates = Object.values(editedRows);
        
        if (updates.length === 0) {
            setIsEditing(false);
            return;
        }
        
        setUpdating(true);
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    pin,
                    action: "bulkRecordSales",
                    salesItems: updates
                }),
            }).then(r => r.json());

            if (response.status === 200) {
                setMessage({ text: `Successfully updated ${updates.length} records.`, type: "success" });
                setEditedRows({});
                setIsEditing(false);
                fetchSalesRecords(true);
            } else {
                setMessage({ text: response.message || "Bulk update failed.", type: "error" });
            }
        } catch (error) {
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
        // Check for epoch/zero values usually returned by GAS on empty/invalid dates
        if (dateStr === 0 || dateStr === "0" || dateStr === "1899-12-30T00:00:00.000Z") return "";
        
        // Check if DD/MM/YYYY
        if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr; 
        
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime()) || d.getTime() < 86400000) return ""; // Guard against epoch
            return d.toLocaleDateString("en-IN", {
                year: "numeric", month: "short", day: "numeric",
            });
        } catch { return dateStr; }
    };

    const toInputDate = (dateStr) => {
        if (!dateStr || dateStr === 0 || dateStr === "0") return "";
        
        // Already ISO?
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        if (typeof dateStr === 'string' && dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime()) || d.getTime() < 86400000) return "";
            return d.toISOString().split('T')[0];
        } catch { return ""; }
    };

    const fromInputDate = (isoStr) => {
        return isoStr; // Return YYYY-MM-DD for standard API compatibility
    };

    const statusClass = (status) => {
        switch ((status || "").toUpperCase()) {
            case "DISPATCHED":  return styles.badgeBlue;
            case "DELIVERED":   return styles.badgeGreen;
            case "CANCELLED":   return styles.badgeRed;
            case "RETURNED":    return styles.badgeOrange;
            case "LOGISTICS_RETURN": return styles.badgeOrange;
            default:            return styles.badgeGray;   // ORDERED
        }
    };

    const renderCellContent = (key, rec) => {
        const rowKey = `${rec.orderId}|${rec.lineId}`;
        const isEdited = editedRows[rowKey] && editedRows[rowKey][key] !== undefined;
        const displayValue = isEdited ? editedRows[rowKey][key] : rec[key];

        if (key === 'status') {
            if (isEditing) {
                return (
                    <select 
                        className={`${styles.cellSelect} ${isEdited ? styles.editedCell : ""}`}
                        value={displayValue || ""}
                        onChange={(e) => handleCellChange(rec.orderId, rec.lineId, key, e.target.value)}
                    >
                        <option value="">N/A</option>
                        {availableStatuses.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                );
            }
            return <span className={`${styles.badge} ${statusClass(displayValue)}`}>{displayValue || "ORDERED"}</span>;
        }

        if (key.toLowerCase().includes('date') && key !== 'timestamp') {
            // Check if this date field is editable
            if (isEditing && EDITABLE_FIELDS.includes(key)) {
                return (
                    <input 
                        type="date"
                        className={`${styles.cellDateInput} ${isEdited ? styles.editedCell : ""}`}
                        value={toInputDate(displayValue)}
                        onChange={(e) => handleCellChange(rec.orderId, rec.lineId, key, fromInputDate(e.target.value))}
                    />
                );
            }
            return <span className={styles.dateText}>{formatDate(displayValue) || <span className={styles.na}>—</span>}</span>;
        }

        if (key === 'timestamp') return <span className={styles.dateText}>{formatDate(displayValue)}</span>;
        if (key === 'orderId') return <span className={styles.highlightText}>{displayValue || "N/A"}</span>;
        if (key === 'skuId') return <span className={styles.skuText}>{displayValue}</span>;
        
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
                                {availableStatuses.length === 0 ? (
                                    <div className={styles.dropdownEmpty}>No statuses loaded</div>
                                ) : (
                                    availableStatuses.map(status => (
                                        <label key={status} className={styles.dropdownItem}>
                                            <input 
                                                type="checkbox" 
                                                checked={statusFilter.includes(status)}
                                                onChange={() => toggleStatusFilter(status)}
                                                className={styles.dropdownCheckbox}
                                            />
                                            {status}
                                        </label>
                                    ))
                                )}
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

            <div className={styles.card}>
                <div className={styles.tableContainer}>
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p>Loading 50K records from server…</p>
                        </div>
                    ) : processedRecords.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {ALL_COLUMNS.filter(c => visibleColumns[c.key]).map(c => (
                                        <th key={`th-${c.key}`}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }} onClick={() => { if(sortBy === c.key) setSortOrder(sortOrder === "asc" ? "desc" : "asc"); else { setSortBy(c.key); setSortOrder("desc"); } }}>
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
                                {paginatedRecords.map((rec, index) => (
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
                                    {[50, 500, 5000, 50000, 500000, 5000000].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.pageControls}>
                            <button className={styles.pageBtn} disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                                Previous
                            </button>
                            <span className={styles.pageDisplay}>Page {currentPage} of {totalPages}</span>
                            <button className={styles.pageBtn} disabled={currentPage >= totalPages}
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
