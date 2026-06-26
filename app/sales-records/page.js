"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

// All available columns mapped to the new Monthly SalesRecord schema
const ALL_COLUMNS = [
    { key: "skuId", label: "SKU ID" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
    { key: "salesChannel", label: "Channel" },
    { key: "grossUnits", label: "Gross Units" },
    { key: "logisticsReturns", label: "Log Returns" },
    { key: "customerReturns", label: "Cust Returns" },
    { key: "cancellations", label: "Cancellations" },
    { key: "netUnits", label: "Net Units" },
    { key: "netSales", label: "Net Sales (₹)" },
    { key: "totalExpenses", label: "Expenses (₹)" },
    { key: "otherBenefits", label: "Benefits (₹)" },
    { key: "projectedBankSettlement", label: "Settlement (₹)" },
    { key: "timestamp", label: "Recorded At" },
];

const DEFAULT_VISIBLE = ["skuId", "month", "year", "salesChannel", "grossUnits", "netUnits", "netSales", "projectedBankSettlement"];

const MONTHS = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" }
];

const SALES_CHANNELS = ["Amazon", "Flipkart", "Shopsy", "Myntra", "Meesho", "Ajio", "Website", "Other"];

export default function SalesRecordsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Core data
    const [allRecords, setAllRecords] = useState([]);
    const [selectedRecordIds, setSelectedRecordIds] = useState(new Set());

    // Filtering & Sorting State (drive server-side fetch)
    const [searchQuery, setSearchQuery] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [channelFilter, setChannelFilter] = useState("");
    const [viewArchived, setViewArchived] = useState(false);
    
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");

    // Dynamic Columns State
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const initial = {};
        ALL_COLUMNS.forEach(c => initial[c.key] = DEFAULT_VISIBLE.includes(c.key));
        return initial;
    });
    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(500);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce timer for search
    const searchTimerRef = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const colMenuRef = useRef(null);
    const actionMenuRef = useRef(null);

    // Click outside to close menus
    useEffect(() => {
        function handleClickOutside(event) {
            if (colMenuRef.current && !colMenuRef.current.contains(event.target)) setIsColMenuOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) setIsActionMenuOpen(false);
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

    // Reset to page 1 and clear selection when filters/sort/view change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedRecordIds(new Set());
    }, [monthFilter, yearFilter, channelFilter, sortBy, sortOrder, pageSize, viewArchived]);

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
            isArchived: String(viewArchived)
        });

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (monthFilter) params.set("month", monthFilter);
        if (yearFilter) params.set("year", yearFilter);
        if (channelFilter) params.set("salesChannel", channelFilter);

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
    }, [currentPage, pageSize, sortBy, sortOrder, debouncedSearch, monthFilter, yearFilter, channelFilter, viewArchived]);

    // Re-fetch whenever page/sort/filter/search changes
    useEffect(() => {
        fetchSalesRecords();
    }, [fetchSalesRecords]);

    // ── Handlers ────────────────────────────────────────────────────────
    const handleRefresh = () => {
        fetchSalesRecords({ forceRefresh: true });
    };

    const toggleColumn = (key) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleRowSelection = (id) => {
        const newSet = new Set(selectedRecordIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRecordIds(newSet);
    };

    const toggleAllSelection = () => {
        if (selectedRecordIds.size === allRecords.length && allRecords.length > 0) {
            setSelectedRecordIds(new Set());
        } else {
            setSelectedRecordIds(new Set(allRecords.map(r => r._id)));
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedRecordIds.size === 0) return;
        setIsActionMenuOpen(false);
        
        if (action === "delete" && !confirm("Are you sure you want to permanently delete the selected records? This action cannot be undone.")) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/employee/sales-records", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, recordIds: Array.from(selectedRecordIds) })
            });
            const response = await res.json();

            if (res.ok && response.success) {
                setMessage({ text: `Successfully processed ${response.modifiedCount} records.`, type: "success" });
                setSelectedRecordIds(new Set());
                fetchSalesRecords(); // Refresh the table
            } else {
                setMessage({ text: response.error || `Failed to ${action} records.`, type: "error" });
                setLoading(false);
            }
        } catch {
            setMessage({ text: `Network error during ${action} action.`, type: "error" });
            setLoading(false);
        }
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

    const getMonthName = (monthNumber) => {
        if (!monthNumber) return "—";
        const found = MONTHS.find(m => m.value === String(monthNumber));
        return found ? found.label : monthNumber;
    };

    const formatCurrency = (val) => {
        if (val == null) return "—";
        return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const renderCellContent = (key, rec) => {
        const displayValue = rec[key];

        if (key === "timestamp") return <span className={styles.dateText}>{formatDate(displayValue)}</span>;
        if (key === "skuId") return <span className={styles.skuText}>{displayValue}</span>;
        if (key === "month") return <span className={styles.highlightText}>{getMonthName(displayValue)}</span>;
        if (key === "year" || key === "salesChannel") return <span className={styles.highlightText}>{displayValue || "—"}</span>;
        if (["netSales", "totalExpenses", "otherBenefits", "projectedBankSettlement"].includes(key)) {
            return <span className={styles.currencyText}>{formatCurrency(displayValue)}</span>;
        }

        return displayValue !== undefined && displayValue !== null ? displayValue : <span className={styles.na}>—</span>;
    };

    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 6 }, (_, i) => currentYear - 4 + i);
    };

    // Calculate Totals for visible rows (allRecords)
    const totals = allRecords.reduce((acc, row) => {
        acc.grossUnits += Number(row.grossUnits) || 0;
        acc.logisticsReturns += Number(row.logisticsReturns) || 0;
        acc.customerReturns += Number(row.customerReturns) || 0;
        acc.cancellations += Number(row.cancellations) || 0;
        acc.netUnits += Number(row.netUnits) || 0;
        acc.netSales += Number(row.netSales) || 0;
        acc.totalExpenses += Number(row.totalExpenses) || 0;
        acc.otherBenefits += Number(row.otherBenefits) || 0;
        acc.projectedBankSettlement += Number(row.projectedBankSettlement) || 0;
        return acc;
    }, {
        grossUnits: 0, logisticsReturns: 0, customerReturns: 0, cancellations: 0,
        netUnits: 0, netSales: 0, totalExpenses: 0, otherBenefits: 0, projectedBankSettlement: 0
    });

    // ────────────────────────────────────────────────────────────────────
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>{viewArchived ? "Archived Sales Records" : "Monthly Sales Records"}</h1>
                    <button className={styles.viewToggleBtn} onClick={() => setViewArchived(!viewArchived)}>
                        {viewArchived ? "View Active Records" : "View Archived"}
                    </button>
                </div>

                <div className={styles.filtersRow}>
                    {/* Bulk Actions Dropdown */}
                    {selectedRecordIds.size > 0 && (
                        <div className={styles.dropdownContainer} ref={actionMenuRef}>
                            <button className={`${styles.dropdownBtn} ${styles.actionsBtn}`} onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
                                Actions ({selectedRecordIds.size})
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            {isActionMenuOpen && (
                                <div className={styles.dropdownMenu}>
                                    {!viewArchived ? (
                                        <div className={styles.dropdownActionItem} onClick={() => handleBulkAction("archive")}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                                            Archive Selected
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.dropdownActionItem} onClick={() => handleBulkAction("restore")}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 9 9 3 15 9"></polyline><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                                                Restore Selected
                                            </div>
                                            <div className={`${styles.dropdownActionItem} ${styles.dangerItem}`} onClick={() => handleBulkAction("delete")}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                Permanently Delete
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search */}
                    <div className={styles.searchWrapper}>
                        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search SKU ID…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Month Filter */}
                    <select className={styles.filterSelect} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                        <option value="">All Months</option>
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    {/* Year Filter */}
                    <select className={styles.filterSelect} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                        <option value="">All Years</option>
                        {generateYearOptions().map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Channel Filter */}
                    <select className={styles.filterSelect} value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
                        <option value="">All Channels</option>
                        {SALES_CHANNELS.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

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

                    {/* Refresh */}
                    <button className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`} onClick={handleRefresh} disabled={refreshing} title="Fetch Latest Data">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                {!loading && allRecords.length > 0 && (
                    <div className={styles.totalsSection}>
                        <div className={styles.totalsHeader}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10"></path><path d="M5 12l3 3-3 3"></path></svg>
                            Visible Rows Totals ({allRecords.length})
                        </div>
                        <div className={styles.totalsGrid}>
                            {visibleColumns.grossUnits && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Gross Units</span>
                                    <span className={styles.totalValue}>{totals.grossUnits}</span>
                                </div>
                            )}
                            {visibleColumns.logisticsReturns && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Log Returns</span>
                                    <span className={styles.totalValue}>{totals.logisticsReturns}</span>
                                </div>
                            )}
                            {visibleColumns.customerReturns && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Cust Returns</span>
                                    <span className={styles.totalValue}>{totals.customerReturns}</span>
                                </div>
                            )}
                            {visibleColumns.cancellations && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Cancellations</span>
                                    <span className={styles.totalValue}>{totals.cancellations}</span>
                                </div>
                            )}
                            {visibleColumns.netUnits && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Net Units</span>
                                    <span className={styles.totalValue}>{totals.netUnits}</span>
                                </div>
                            )}
                            {visibleColumns.netSales && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Net Sales</span>
                                    <span className={styles.totalValueCurrency}>{formatCurrency(totals.netSales)}</span>
                                </div>
                            )}
                            {visibleColumns.totalExpenses && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Expenses</span>
                                    <span className={styles.totalValueCurrency}>{formatCurrency(totals.totalExpenses)}</span>
                                </div>
                            )}
                            {visibleColumns.otherBenefits && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Benefits</span>
                                    <span className={styles.totalValueCurrency}>{formatCurrency(totals.otherBenefits)}</span>
                                </div>
                            )}
                            {visibleColumns.projectedBankSettlement && (
                                <div className={styles.totalBox}>
                                    <span className={styles.totalLabel}>Settlement</span>
                                    <span className={styles.totalValueCurrency}>{formatCurrency(totals.projectedBankSettlement)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                                        <th className={styles.checkboxCell}>
                                            <input 
                                                type="checkbox" 
                                                className={styles.rowCheckbox}
                                                checked={selectedRecordIds.size === allRecords.length && allRecords.length > 0}
                                                onChange={toggleAllSelection}
                                            />
                                        </th>
                                        {ALL_COLUMNS.filter(c => visibleColumns[c.key]).map(c => (
                                            <th key={`th-${c.key}`}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => { if (sortBy === c.key) setSortOrder(sortOrder === "asc" ? "desc" : "asc"); else { setSortBy(c.key); setSortOrder("desc"); } }}>
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
                                    {allRecords.map((rec, index) => {
                                        const isSelected = selectedRecordIds.has(rec._id);
                                        return (
                                            <tr key={`row-${rec._id}-${index}`} className={isSelected ? styles.rowSelected : ""}>
                                                <td className={styles.checkboxCell}>
                                                    <input 
                                                        type="checkbox" 
                                                        className={styles.rowCheckbox}
                                                        checked={isSelected}
                                                        onChange={() => toggleRowSelection(rec._id)}
                                                    />
                                                </td>
                                                {ALL_COLUMNS.filter(c => visibleColumns[c.key]).map(c => (
                                                    <td key={`td-${c.key}-${index}`}>
                                                        {renderCellContent(c.key, rec)}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
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
