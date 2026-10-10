"use client";
import { useState, useEffect, useEffectEvent } from "react";

import { parseSearchQuery, matchesSearchTerms, matchesArraySearchTerms } from "@/utils/searchUtils";

// Owns filter/sort/search state, local filtering + pagination, and the toolbar/pagination handlers.
export default function useListingsFilters({ allListingsData, fetchListings }) {
    const [listings, setListings] = useState([]); // Currently displayed filtered/paginated data
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(100);

    // Filter/Sort States
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [selectedVertical, setSelectedVertical] = useState("");
    const [selectedMarketplace, setSelectedMarketplace] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [inventoryIdQuery, setInventoryIdQuery] = useState("");
    const [styleIdQuery, setStyleIdQuery] = useState("");

    const getFilteredListings = () => {
        let filtered = [...allListingsData];

        // 1. Filter by vertical
        if (selectedVertical) {
            filtered = filtered.filter(item => item.vertical === selectedVertical);
        }

        // 1.5 Filter by marketplace
        if (selectedMarketplace) {
            filtered = filtered.filter(item => (item.marketplace || "Direct") === selectedMarketplace);
        }

        // 2. Filter by Search Query (SKU ID)
        if (searchQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(searchQuery);
            filtered = filtered.filter(item =>
                matchesSearchTerms(item.skuId, includeTerms, excludeTerms)
            );
        }

        // 3. Filter by Inventory ID
        if (inventoryIdQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(inventoryIdQuery);
            filtered = filtered.filter(item => {
                const invIds = item.inventoryItems?.map(inv => inv.inventoryId).filter(Boolean) || [];
                return matchesArraySearchTerms(invIds, includeTerms, excludeTerms);
            });
        }

        // 3.5 Filter by Style ID (Myntra)
        if (styleIdQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(styleIdQuery);
            filtered = filtered.filter(item =>
                matchesSearchTerms(item.styleId, includeTerms, excludeTerms)
            );
        }

        // 3.6 Filter by Status
        if (selectedStatus) {
            filtered = filtered.filter(item =>
                item.status?.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        // 4. Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            if (sortOrder === "newest_first") {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        return filtered;
    };

    const processLocalData = () => {
        const filtered = getFilteredListings();

        // 5. Update Total Items (for Pagination math)
        setTotalItems(filtered.length);

        // 6. Paginate
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

        setListings(paginatedItems);
    };

    // Apply Filters, Sort, and Pagination locally whenever dependencies change (useEffectEvent reads the latest processLocalData)
    const onLocalDataInputsChange = useEffectEvent(() => processLocalData());
    useEffect(() => {
        onLocalDataInputsChange();
    }, [allListingsData, currentPage, sortOrder, selectedVertical, selectedMarketplace, selectedStatus, searchQuery, inventoryIdQuery, styleIdQuery, pageSize]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setCurrentPage(1);
            // processLocalData is triggered by useEffect
        }
    };

    const handleReset = () => {
        setSearchQuery("");
        setInventoryIdQuery("");
        setStyleIdQuery("");
        setSelectedVertical("");
        setSelectedMarketplace("");
        setSelectedStatus("");
        setSortOrder("newest_first");
        setCurrentPage(1); // Resetting page
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchListings(true); // Force fetch from server
    };

    const handleNextPage = () => setCurrentPage(prev => Math.min(Math.ceil(totalItems / pageSize) || 1, prev + 1));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

    const handleSearchQueryChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
    const handleInventoryIdQueryChange = (e) => { setInventoryIdQuery(e.target.value); setCurrentPage(1); };
    const handleStyleIdQueryChange = (e) => { setStyleIdQuery(e.target.value); setCurrentPage(1); };
    const handleSearchClick = () => setCurrentPage(1);
    const handleVerticalChange = (e) => {
        setSelectedVertical(e.target.value);
        setCurrentPage(1);
    };
    const handleMarketplaceChange = (e) => {
        setSelectedMarketplace(e.target.value);
        setCurrentPage(1);
    };
    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
        setCurrentPage(1);
    };
    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
        setCurrentPage(1);
    };
    const handlePageSizeChange = e => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    return {
        listings,
        currentPage,
        totalItems,
        pageSize,
        sortOrder,
        selectedVertical,
        selectedMarketplace,
        selectedStatus,
        searchQuery,
        inventoryIdQuery,
        styleIdQuery,
        getFilteredListings,
        handleSearch,
        handleReset,
        handleRefresh,
        handleNextPage,
        handlePrevPage,
        handleSearchQueryChange,
        handleInventoryIdQueryChange,
        handleStyleIdQueryChange,
        handleSearchClick,
        handleVerticalChange,
        handleMarketplaceChange,
        handleStatusChange,
        handleSortOrderChange,
        handlePageSizeChange,
    };
}
