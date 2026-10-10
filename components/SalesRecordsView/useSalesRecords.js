import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ALL_COLUMNS, DEFAULT_VISIBLE } from "./salesRecordsConfig";

export function useSalesRecords() {
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

    const handleHeaderSort = (key) => {
        if (sortBy === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        else { setSortBy(key); setSortOrder("desc"); }
    };

    return {
        loading, refreshing, confirmModal, setConfirmModal, allRecords, selectedRecordIds,
        searchQuery, setSearchQuery, monthFilter, setMonthFilter, yearFilter, setYearFilter,
        channelFilter, setChannelFilter, viewArchived, setViewArchived,
        sortBy, setSortBy, sortOrder, setSortOrder, visibleColumns,
        isColMenuOpen, setIsColMenuOpen, isActionMenuOpen, setIsActionMenuOpen,
        currentPage, setCurrentPage, pageSize, setPageSize, totalItems, totalPages,
        colMenuRef, actionMenuRef, handleRefresh, toggleColumn, toggleRowSelection,
        toggleAllSelection, handleBulkAction, totals, handleHeaderSort,
    };
}
