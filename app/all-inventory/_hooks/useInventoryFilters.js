"use client";
import { useState, useEffect, useEffectEvent } from "react";
import { useRouter } from "next/navigation";

import { parseSearchQuery, matchesSearchTerms } from "@/utils/searchUtils";

// Owns filter/sort/search state, local filtering + pagination, toolbar/pagination handlers
// and the archived toggle (synced to the URL).
export default function useInventoryFilters({ allInventoryData, showArchived, setShowArchived, fetchInventory }) {
    const [inventory, setInventory] = useState([]); // Currently displayed filtered/paginated data
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(100);

    // Filter/Sort States
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [selectedVertical, setSelectedVertical] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const router = useRouter();

    const processLocalData = () => {
        let filtered = [...allInventoryData];

        // 0. Filter by archived state — only show what belongs to current view
        filtered = filtered.filter(item =>
            showArchived ? item.isArchived === true : !item.isArchived
        );

        // 1. Filter by vertical
        if (selectedVertical) {
            filtered = filtered.filter(item => item.vertical === selectedVertical);
        }

        // 2. Filter by Search Query
        if (searchQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(searchQuery);
            filtered = filtered.filter(item =>
                matchesSearchTerms(item.inventoryId, includeTerms, excludeTerms)
            );
        }

        // 3. Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            if (sortOrder === "newest_first") {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        // 4. Update Total Items (for Pagination math)
        setTotalItems(filtered.length);

        // 5. Paginate
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

        setInventory(paginatedItems);
    };

    // Apply Filters, Sort, and Pagination locally whenever dependencies change
    // Re-run only for these inputs; useEffectEvent reads the latest processLocalData
    const onLocalDataInputsChange = useEffectEvent(() => processLocalData());

    useEffect(() => {
        onLocalDataInputsChange();
    }, [allInventoryData, currentPage, sortOrder, selectedVertical, searchQuery, pageSize, showArchived]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setCurrentPage(1);
            // processLocalData is triggered by useEffect
        }
    };

    const handleReset = () => {
        setSearchQuery("");
        setSelectedVertical("");
        setSortOrder("newest_first");
        setCurrentPage(1); // Resetting page
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchInventory(true, showArchived); // Force fetch from server, respecting archived state
    };

    const handleNextPage = () => setCurrentPage(prev => Math.min(Math.ceil(totalItems / pageSize) || 1, prev + 1));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

    const handleSearchQueryChange = (e) => setSearchQuery(e.target.value);

    const handleVerticalChange = (e) => {
        setSelectedVertical(e.target.value);
        setCurrentPage(1);
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
        setCurrentPage(1);
    };

    const handleToggleArchived = () => {
        const newArchivedState = !showArchived;
        setShowArchived(newArchivedState);
        setCurrentPage(1);
        // Sync URL
        const params = new URLSearchParams(window.location.search);
        if (newArchivedState) {
            params.set('archived', 'true');
        } else {
            params.delete('archived');
        }
        router.replace(`?${params.toString()}`, { scroll: false });
        fetchInventory(true, newArchivedState);
    };

    const handlePageSizeChange = e => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    return {
        inventory,
        currentPage,
        totalItems,
        pageSize,
        sortOrder,
        selectedVertical,
        searchQuery,
        handleSearch,
        handleReset,
        handleRefresh,
        handleNextPage,
        handlePrevPage,
        handleSearchQueryChange,
        handleVerticalChange,
        handleSortOrderChange,
        handleToggleArchived,
        handlePageSizeChange,
    };
}
