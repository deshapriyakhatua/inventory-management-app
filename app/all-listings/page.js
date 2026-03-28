"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { fetchVerticalsData } from "../../utils/apiUtils";

export default function AllListingsPage() {
    const [allListingsData, setAllListingsData] = useState([]); // All data from API/Local Storage
    const [listings, setListings] = useState([]); // Currently displayed filtered/paginated data
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingListingId, setDeletingListingId] = useState(null);
    const [pageSize, setPageSize] = useState(100);

    // Filter/Sort States
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [selectedVertical, setSelectedVertical] = useState("");
    const [selectedMarketplace, setSelectedMarketplace] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [inventoryIdQuery, setInventoryIdQuery] = useState("");

    // Modal State
    const [selectedListing, setSelectedListing] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadInitialData();
        fetchListings(false); // Try loading from local storage first
    }, []);

    // Apply Filters, Sort, and Pagination locally whenever dependencies change
    useEffect(() => {
        processLocalData();
    }, [allListingsData, currentPage, sortOrder, selectedVertical, selectedMarketplace, searchQuery, inventoryIdQuery, pageSize]);

    const processLocalData = () => {
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
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.skuId.toLowerCase().includes(query)
            );
        }

        // 3. Filter by Inventory ID
        if (inventoryIdQuery) {
            const invQuery = inventoryIdQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.inventoryItems?.some(inv =>
                    inv.inventoryId?.toLowerCase().includes(invQuery)
                )
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

        // 5. Update Total Items (for Pagination math)
        setTotalItems(filtered.length);

        // 6. Paginate
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

        setListings(paginatedItems);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setCurrentPage(1);
            // processLocalData is triggered by useEffect
        }
    };

    const handleReset = () => {
        setSearchQuery("");
        setInventoryIdQuery("");
        setSelectedVertical("");
        setSelectedMarketplace("");
        setSortOrder("newest_first");
        setCurrentPage(1); // Resetting page
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchListings(true); // Force fetch from server
    };

    const handleDelete = async (skuId) => {
        setDeletingListingId(skuId);
        setDeleteButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/listing?skuId=${skuId}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setMessage({ text: "Listing deleted successfully.", type: "success" });
                // Update local data
                const updatedData = allListingsData.filter(item => item.skuId !== skuId);
                setAllListingsData(updatedData);
                localStorage.setItem("all_listings_data", JSON.stringify(updatedData));
            } else {
                setMessage({ text: result.error || "Failed to delete listing.", type: "error" });
            }
        } catch (error) {
            console.error("Network Error:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingListingId(null);
        }
    };

    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setMessage({ text: `${label} copied to clipboard!`, type: "success" });
        } catch (err) {
            console.error("Failed to copy:", err);
            setMessage({ text: "Failed to copy to clipboard", type: "error" });
        }
    };

    const loadInitialData = async () => {
        const pin = sessionStorage.getItem("app_pin");
        try {
            const cachedVerticals = await fetchVerticalsData(pin);
            setVerticals(cachedVerticals || []);
        } catch (error) {
            console.error("Failed to load verticals:", error);
        }
    };

    const fetchListings = async (forceRefresh = false) => {
        // Check local storage if not forcing refresh
        if (!forceRefresh) {
            const cachedData = localStorage.getItem("all_listings_data");
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setAllListingsData(parsed);
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error("Failed to parse cached listings");
                }
            }
        }

        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setMessage({ text: "", type: "" });

        try {
            const response = await fetch("/api/employee/listing");
            const result = await response.json();

            if (response.ok && result.success) {
                const fetchedData = result.data || [];
                setAllListingsData(fetchedData);
                localStorage.setItem("all_listings_data", JSON.stringify(fetchedData));

                if (forceRefresh) {
                    setMessage({ text: "Listings refreshed successfully.", type: "success" });
                }
            } else {
                setMessage({ text: result.error || "Failed to load listings.", type: "error" });
                if (!allListingsData.length) setAllListingsData([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setMessage({ text: "Network error while loading data.", type: "error" });
            if (!allListingsData.length) setAllListingsData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleNextPage = () => setCurrentPage(prev => Math.min(Math.ceil(totalItems / pageSize) || 1, prev + 1));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>SKU</h1>

                <div className={styles.controlsRow}>
                    <div className={styles.filtersGroup}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Search SKU ID..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                onKeyDown={handleSearch}
                                className={styles.searchInput}
                            />
                            <button className={styles.searchBtn} onClick={handleSearch} title="Search">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Search Inventory ID..."
                                value={inventoryIdQuery}
                                onChange={(e) => { setInventoryIdQuery(e.target.value); setCurrentPage(1); }}
                                className={styles.searchInput}
                            />
                            <button className={styles.searchBtn} onClick={() => setCurrentPage(1)} title="Search">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>

                        <select
                            className={styles.filterSelect}
                            value={selectedVertical}
                            onChange={(e) => {
                                setSelectedVertical(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Verticals</option>
                            {verticals.map(v => (
                                <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                            ))}
                        </select>

                        <select
                            className={styles.filterSelect}
                            value={selectedMarketplace}
                            onChange={(e) => {
                                setSelectedMarketplace(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Marketplaces</option>
                            <option value="Amazon">Amazon</option>
                            <option value="Flipkart">Flipkart</option>
                            <option value="Shopsy">Shopsy</option>
                            <option value="Myntra">Myntra</option>
                            <option value="Meesho">Meesho</option>
                            <option value="Ajio">Ajio</option>
                            <option value="Website">Website</option>
                            <option value="Other">Other</option>
                        </select>

                        <select
                            className={styles.filterSelect}
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="newest_first">Newest First</option>
                            <option value="oldest_first">Oldest First</option>
                        </select>

                        <button
                            className={styles.resetBtn}
                            onClick={handleReset}
                            title="Reset Filters"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <polyline points="23 20 23 14 17 14"></polyline>
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                            </svg>
                            Reset
                        </button>

                        <button
                            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Refresh Data"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            Refresh
                        </button>
                    </div>

                    <div className={styles.viewControls}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.activeView : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading Listings...</p>
                </div>
            ) : listings.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No listings found.</p>
                </div>
            ) : (
                <div className={styles.contentArea}>
                    <div className={styles.scrollWrapper}>
                        {viewMode === 'grid' ? (
                            <div className={styles.gridContainer}>
                                {listings.map((item) => {
                                    const validImages = item.inventoryItems?.filter(inv => inv.imageUrl) || [];
                                    const displayImages = validImages.slice(0, 4);

                                    return (
                                        <div
                                            key={item.skuId}
                                            className={styles.gridCard}
                                            onClick={() => setSelectedListing(item)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.skuId);
                                                }}
                                                className={styles.deleteBtn}
                                                title="Delete Listing"
                                                disabled={deleteButtonLoading}
                                            >
                                                {deleteButtonLoading && deletingListingId === item.skuId
                                                    ? <svg xmlns="http://www.w3.org/2000/svg" className={styles.deleteLoadingIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                                        <path d="M21 3v5h-5"></path>
                                                    </svg>
                                                    : <svg xmlns="http://www.w3.org/2000/svg" className={styles.deleteIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                }
                                            </button>
                                            <div className={styles.imageContainer} data-count={displayImages.length}>
                                                {displayImages.length > 0 ? (
                                                    displayImages.map((inv, idx) => (
                                                        <div key={idx} className={styles.multiImageCell}>
                                                            <Image
                                                                src={inv.imageUrl}
                                                                alt={item.skuId}
                                                                referrerPolicy="no-referrer"
                                                                fill
                                                                className={styles.itemImage}
                                                                unoptimized
                                                            />
                                                            {idx === 3 && validImages.length > 4 && (
                                                                <div className={styles.moreImagesOverlay}>
                                                                    +{validImages.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className={styles.imagePlaceholder}>
                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '0.5rem' }}>
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                            <polyline points="21 15 16 10 5 21"></polyline>
                                                        </svg>
                                                        <br />No Images
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <div className={styles.skuHeaderRow}>
                                                    <p className={styles.itemId}>{item.skuId}</p>
                                                    <button
                                                        className={styles.smallCopyBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyToClipboard(item.skuId, "SKU ID");
                                                        }}
                                                        title="Copy SKU ID"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '4px' }}>
                                                    <p className={styles.itemDate}>{item.vertical}</p>
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>•</span>
                                                    <p className={styles.itemDate} style={{ color: '#94a3b8' }}>{item.marketplace || 'Direct'}</p>
                                                </div>
                                                <p className={styles.itemDate}>
                                                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className={styles.listContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Thumbnails</th>
                                            <th>SKU ID</th>
                                            <th>Vertical</th>
                                            <th>Marketplace</th>
                                            <th>Date Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listings.map((item) => (
                                            <tr
                                                key={item.skuId}
                                                className={styles.tableRow}
                                                onClick={() => setSelectedListing(item)}
                                            >
                                                <td className={styles.tdImage}>
                                                    {item.inventoryItems && item.inventoryItems.length > 0 ? (
                                                        <div className={styles.listThumbStack}>
                                                            {item.inventoryItems.map((inv, idx) => (
                                                                inv.imageUrl ? (
                                                                    <div key={idx} className={styles.listThumbnailContainer}>
                                                                        <Image
                                                                            src={inv.imageUrl}
                                                                            alt={inv.inventoryId}
                                                                            referrerPolicy="no-referrer"
                                                                            fill
                                                                            className={styles.listThumbnail}
                                                                            unoptimized
                                                                        />
                                                                    </div>
                                                                ) : null
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className={styles.listThumbnailPlaceholder}>-</div>
                                                    )}
                                                </td>
                                                <td className={styles.tdId}>
                                                    <div className={styles.listSkuRow}>
                                                        {item.skuId}
                                                        <button
                                                            className={styles.listSmallCopyBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyToClipboard(item.skuId, "SKU ID");
                                                            }}
                                                            title="Copy SKU ID"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className={styles.tdVertical}>{item.vertical}</td>
                                                <td className={styles.tdVertical} style={{ color: '#94a3b8' }}>{item.marketplace || 'Direct'}</td>
                                                <td className={styles.tdDate}>
                                                    {new Date(item.createdAt).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                </td>
                                                <td className={styles.tdActions}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item.skuId);
                                                        }}
                                                        className={styles.listDeleteBtn}
                                                        title="Delete Listing"
                                                        disabled={deleteButtonLoading}
                                                    >
                                                        {deleteButtonLoading && deletingListingId === item.skuId
                                                            ? <svg xmlns="http://www.w3.org/2000/svg" className={styles.deleteLoadingIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                                                <path d="M21 3v5h-5"></path>
                                                            </svg>
                                                            : <svg xmlns="http://www.w3.org/2000/svg" className={styles.deleteIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        }
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {/* Pagination */}
                    {totalItems > 0 && (
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
                                        onChange={e => {
                                            setPageSize(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {[20, 50, 100, 500, 5000].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.pageControls}>
                                <button className={styles.pageBtn} disabled={currentPage === 1}
                                    onClick={handlePrevPage}>
                                    Previous
                                </button>
                                <span className={styles.pageDisplay}>Page {currentPage} of {Math.ceil(totalItems / pageSize) || 1}</span>
                                <button className={styles.pageBtn} disabled={currentPage >= (Math.ceil(totalItems / pageSize) || 1)}
                                    onClick={handleNextPage}>
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Listing Details Modal */}
            {selectedListing && (
                <div className={styles.modalOverlay} onClick={() => setSelectedListing(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Listing Details</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedListing(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.modalSection}>
                                <div className={styles.skuHeaderRow}>
                                    <h3>{selectedListing.skuId}</h3>
                                    <button
                                        className={styles.iconCopyBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(selectedListing.skuId, "SKU ID");
                                        }}
                                        title="Copy SKU ID"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div className={styles.metaGrid}>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Vertical</span>
                                        <span className={styles.metaValue}>{selectedListing.vertical}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Marketplace</span>
                                        <span className={styles.metaValue}>{selectedListing.marketplace || 'Direct'}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Date Created</span>
                                        <span className={styles.metaValue}>
                                            {new Date(selectedListing.createdAt).toLocaleString('en-US', {
                                                month: 'long', day: 'numeric', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Total Items</span>
                                        <span className={styles.metaValue}>{selectedListing.inventoryItems?.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <h4 className={styles.inventoryTitle}>Associated Inventory</h4>
                                {selectedListing.inventoryItems && selectedListing.inventoryItems.length > 0 ? (
                                    <div className={styles.modalInventoryGrid}>
                                        {selectedListing.inventoryItems.map((inv, idx) => (
                                                <div key={idx} className={styles.modalInventoryCard}>
                                                    <div className={styles.modalImageWrapper}>
                                                        {inv.imageUrl ? (
                                                            <Image
                                                                src={inv.imageUrl}
                                                                alt={inv.inventoryId}
                                                                referrerPolicy="no-referrer"
                                                                fill
                                                                style={{ objectFit: 'cover' }}
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className={styles.modalImagePlaceholder}>No Image</div>
                                                        )}
                                                    </div>
                                                <div className={styles.modalCardFooter}>
                                                    <span className={styles.modalInventoryId}>{inv.inventoryId}</span>
                                                    <button
                                                        className={styles.smallCopyBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyToClipboard(inv.inventoryId, "Inventory ID");
                                                        }}
                                                        title="Copy ID"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.modalEmpty}>No inventory associated with this SKU.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Toast
                message={message}
                onClose={() => setMessage({ text: "", type: "" })}
            />
        </div>
    );
}
