"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./SalesRecordsView.module.css";

import ConfirmModal from "../ConfirmModal/ConfirmModal";

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

const DEFAULT_VISIBLE = [
    "skuId", "month", "year", "salesChannel",
    "grossUnits", "netUnits", "netSales", "projectedBankSettlement",
];

const MONTHS = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

const SALES_CHANNELS = ["Amazon", "Flipkart", "Shopsy", "Myntra", "Meesho", "Ajio", "Website", "Other"];

export default function SalesRecordsView({ title = "Sales Records", archivedTitle = "Archived Sales Records" }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmLabel: "Confirm",
        variant: "danger",
        onConfirm: null,
        isLoading: false,
    });

    const [allRecords, setAllRecords] = useState([]);
    const [selectedRecordIds, setSelectedRecordIds] = useState(new Set());

    const [searchQuery, setSearchQuery] = useState("");
    const [monthFilter, setMonthFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [channelFilter, setChannelFilter] = useState("");
    const [viewArchived, setViewArchived] = useState(false);

    const [sortBy, setSortBy] = useState("timestamp");
    const [sortOrder, setSortOrder] = useState("desc");

    const [visibleColumns, setVisibleColumns] = useState(() => {
        const initial = {};
        ALL_COLUMNS.forEach(c => { initial[c.key] = DEFAULT_VISIBLE.includes(c.key); });
        return initial;
    });
    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(500);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const searchTimerRef = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const colMenuRef = useRef(null);
    const actionMenuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (colMenuRef.current && !colMenuRef.current.contains(event.target)) setIsColMenuOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) setIsActionMenuOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(searchTimerRef.current);
    }, [searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedRecordIds(new Set());
    }, [monthFilter, yearFilter, channelFilter, sortBy, sortOrder, pageSize, viewArchived]);

    const fetchSalesRecords = useCallback(async (opts = {}) => {
        const isRefresh = opts.forceRefresh === true;

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const params = new URLSearchParams({
            page: String(opts.page ?? currentPage),
            pageSize: String(opts.pageSize ?? pageSize),
            sortBy,
            sortOrder,
            isArchived: String(viewArchived),
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
                if (isRefresh) toast.success("Records refreshed.", { id: "app-feedback", duration: 3000 });
            } else {
                toast.error(response.error || "Failed to load records.", { id: "app-feedback", duration: 3000 });
            }
        } catch {
            toast.error("Network error fetching records.", { id: "app-feedback", duration: 3000 });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, pageSize, sortBy, sortOrder, debouncedSearch, monthFilter, yearFilter, channelFilter, viewArchived]);

    useEffect(() => {
        fetchSalesRecords();
    }, [fetchSalesRecords]);

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

    const executeBulkAction = async (action) => {
        setLoading(true);
        try {
            const res = await fetch("/api/employee/sales-records", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, recordIds: Array.from(selectedRecordIds) }),
            });
            const response = await res.json();

            if (res.ok && response.success) {
                toast.success(`Successfully processed ${response.modifiedCount} records.`, { id: "app-feedback", duration: 3000 });
                setSelectedRecordIds(new Set());
                fetchSalesRecords();
            } else {
                toast.error(response.error || `Failed to ${action} records.`, { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while processing bulk action.", { id: "app-feedback", duration: 3000 });
        } finally {
            setLoading(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedRecordIds.size === 0) return;
        setIsActionMenuOpen(false);

        if (action === "delete") {
            setConfirmModal({
                isOpen: true,
                title: "Delete Sales Records",
                message: `Are you sure you want to permanently delete the ${selectedRecordIds.size} selected sales record(s)? This action cannot be undone.`,
                confirmLabel: "Delete Records",
                variant: "danger",
                isLoading: false,
                onConfirm: () => executeBulkAction("delete"),
            });
            return;
        }

        executeBulkAction(action);
    };

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
        if (val == null || isNaN(Number(val))) return "—";
        return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        netUnits: 0, netSales: 0, totalExpenses: 0, otherBenefits: 0, projectedBankSettlement: 0,
    });

    const pageTitle = viewArchived ? archivedTitle : title;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>{pageTitle}</h1>
                    <button className={styles.viewToggleBtn} onClick={() => setViewArchived(!viewArchived)}>
                        {viewArchived ? "View Active Records" : "View Archived"}
                    </button>
                </div>

                <div className={styles.filtersRow}>
                    {selectedRecordIds.size > 0 && (
                        <div className={styles.dropdownContainer} ref={actionMenuRef}>
                            <button className={`${styles.dropdownBtn} ${styles.actionsBtn}`} onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
                                Actions ({selectedRecordIds.size})
                                <Icon name="click-to-select-from-inventory" size={14} />
                            </button>
                            {isActionMenuOpen && (
                                <div className={styles.dropdownMenu}>
                                    {!viewArchived ? (
                                        <div className={styles.dropdownActionItem} onClick={() => handleBulkAction("archive")}>
                                            <Icon name="archive-this-record" size={14} />
                                            Archive Selected
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.dropdownActionItem} onClick={() => handleBulkAction("restore")}>
                                                <Icon name="icon-eec919d0" size={14} />
                                                Restore Selected
                                            </div>
                                            <div className={`${styles.dropdownActionItem} ${styles.dangerItem}`} onClick={() => handleBulkAction("delete")}>
                                                <Icon name="trash" size={14} />
                                                Permanently Delete
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.searchWrapper}>
                        <Icon name="icon-9c4a10ac" size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search SKU ID…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select className={styles.filterSelect} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                        <option value="">All Months</option>
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    <select className={styles.filterSelect} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                        <option value="">All Years</option>
                        {generateYearOptions().map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select className={styles.filterSelect} value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
                        <option value="">All Channels</option>
                        {SALES_CHANNELS.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <div className={styles.dropdownContainer} ref={colMenuRef}>
                        <button className={styles.dropdownBtn} onClick={() => setIsColMenuOpen(!isColMenuOpen)}>
                            Columns
                            <Icon name="click-to-select-from-inventory" size={14} />
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

                    <select className={styles.filterSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        {ALL_COLUMNS.map(c => (
                            <option key={`sort-${c.key}`} value={c.key}>Sort: {c.label}</option>
                        ))}
                    </select>

                    <select className={styles.filterSelect} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>

                    <button className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`} onClick={handleRefresh} disabled={refreshing} title="Fetch Latest Data">
                        <Icon name="refresh" size={18} />
                    </button>
                </div>
            </div>

            <div className={styles.contentArea}>
                {!loading && allRecords.length > 0 && (
                    <div className={styles.totalsSection}>
                        <div className={styles.totalsHeader}>
                            <Icon name="icon-3af5fc37" size={16} />
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
                                                        <Icon name="icon-b18c9210" size={12} sortOrder={sortOrder} />
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

                    <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                isLoading={confirmModal.isLoading}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
