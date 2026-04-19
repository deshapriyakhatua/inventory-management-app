"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { fetchVerticalsData } from "../../utils/apiUtils";
import MarketplaceLogo from "../../components/MarketplaceLogo/MarketplaceLogo";

const STATUS_COLORS = {
    active: { dot: '#22c55e', label: '#22c55e' },   // green
    inactive: { dot: '#f59e0b', label: '#f59e0b' },   // amber
    blocked: { dot: '#ef4444', label: '#ef4444' },   // red
    archived: { dot: '#94a3b8', label: '#94a3b8' },   // slate
};

function StatusDot({ status, size = 8 }) {
    const color = STATUS_COLORS[status?.toLowerCase()]?.dot || '#94a3b8';
    return (
        <span
            style={{
                display: 'inline-block',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                flexShrink: 0,
                boxShadow: `0 0 5px ${color}88`,
            }}
        />
    );
}

export default function AllListingsPage() {
    const [allListingsData, setAllListingsData] = useState([]); // All data from API/Local Storage
    const [listings, setListings] = useState([]); // Currently displayed filtered/paginated data
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    // Detail Modal State
    const [selectedListing, setSelectedListing] = useState(null);

    // Edit Modal State
    const [editingListing, setEditingListing] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editSaving, setEditSaving] = useState(false);

    // Inventory Picker State
    const [showInventoryPicker, setShowInventoryPicker] = useState(false);
    const [inventoryPickerItems, setInventoryPickerItems] = useState([]);
    const [inventoryPickerLoading, setInventoryPickerLoading] = useState(false);
    const [inventoryPickerSearch, setInventoryPickerSearch] = useState("");

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

    const openEditModal = (listing) => {
        setEditingListing(listing);
        setEditForm({
            vertical: listing.vertical || "",
            marketplace: listing.marketplace || "",
            status: listing.status || "active",
            inventoryItems: listing.inventoryItems?.map(inv => inv.inventoryId || inv) || [],
        });
        setShowInventoryPicker(false);
        setInventoryPickerSearch("");
    };

    const openInventoryPicker = async () => {
        setShowInventoryPicker(true);
        if (inventoryPickerItems.length > 0) return; // already loaded
        setInventoryPickerLoading(true);
        try {
            const res = await fetch("/api/employee/inventory");
            const result = await res.json();
            if (res.ok && result.success) {
                setInventoryPickerItems(result.data || []);
            }
        } catch (e) {
            console.error("Failed to load inventory for picker:", e);
        } finally {
            setInventoryPickerLoading(false);
        }
    };

    const toggleInventoryItem = (inventoryId) => {
        setEditForm(f => {
            const exists = f.inventoryItems.includes(inventoryId);
            return {
                ...f,
                inventoryItems: exists
                    ? f.inventoryItems.filter(id => id !== inventoryId)
                    : [...f.inventoryItems, inventoryId],
            };
        });
    };

    const handleEditSave = async () => {
        setEditSaving(true);
        try {
            const res = await fetch("/api/employee/listing", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skuId: editingListing.skuId,
                    ...editForm,
                }),
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setMessage({ text: "Listing updated successfully.", type: "success" });
                // Update local cache
                const updated = allListingsData.map(item =>
                    item.skuId === editingListing.skuId
                        ? { ...item, ...editForm, inventoryItems: editForm.inventoryItems.map(id => ({ inventoryId: id, imageUrl: item.inventoryItems.find(i => i.inventoryId === id)?.imageUrl || null })) }
                        : item
                );
                setAllListingsData(updated);
                localStorage.setItem("all_listings_data", JSON.stringify(updated));
                setEditingListing(null);
            } else {
                setMessage({ text: result.error || "Failed to update listing.", type: "error" });
            }
        } catch (e) {
            console.error("Edit Error:", e);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setEditSaving(false);
        }
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
                        <div className={styles.gridContainer}>
                                {listings.map((item, index) => {
                                    const validImages = item.inventoryItems?.filter(inv => inv.imageUrl) || [];
                                    const displayImages = validImages.slice(0, 4);

                                    return (
                                        <div
                                            key={index}
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
                                            {/* Edit button – sits top-right on the card */}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                                className={styles.editCardBtn}
                                                title="Edit Listing"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
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
                                                <div className={styles.metaInfoRow}>
                                                    <StatusDot status={item.status} />
                                                    <p
                                                        className={styles.itemStatus}
                                                        style={{ color: STATUS_COLORS[item.status?.toLowerCase()]?.label || '#94a3b8' }}
                                                    >
                                                        {item.status?.toUpperCase() || "ACTIVE"}
                                                    </p>
                                                    <span className={styles.dotSeparator}>•</span>
                                                    <div className={styles.marketplaceBadge}>
                                                        <MarketplaceLogo marketplace={item.marketplace} size={16} />
                                                        <p className={styles.itemMarketplace}>{item.marketplace || 'Direct'}</p>
                                                    </div>
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
                                        <span className={styles.metaLabel}>Status</span>
                                        <div className={styles.metaValueBadge}>
                                            <StatusDot status={selectedListing.status} size={10} />
                                            <span
                                                className={styles.metaValue}
                                                style={{ color: STATUS_COLORS[selectedListing.status?.toLowerCase()]?.label || '#94a3b8' }}
                                            >
                                                {selectedListing.status?.charAt(0).toUpperCase() + selectedListing.status?.slice(1) || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Vertical</span>
                                        <span className={styles.metaValue}>{selectedListing.vertical}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Marketplace</span>
                                        <div className={styles.metaValueBadge}>
                                            <MarketplaceLogo marketplace={selectedListing.marketplace} size={22} />
                                            <span className={styles.metaValue}>{selectedListing.marketplace || 'Direct'}</span>
                                        </div>
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

            {/* ── EDIT MODAL ─────────────────────────────────────── */}
            {editingListing && (
                <div className={styles.modalOverlay} onClick={() => setEditingListing(null)}>
                    <div className={styles.editModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>Edit Listing</h2>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{editingListing.skuId}</p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setEditingListing(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className={styles.editModalBody}>
                            {/* Status */}
                            <div className={styles.editField}>
                                <label className={styles.editLabel}>Status</label>
                                <div className={styles.editStatusGrid}>
                                    {['active', 'inactive', 'blocked', 'archived'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`${styles.statusPill} ${editForm.status === s ? styles.statusPillActive : ''}`}
                                            style={editForm.status === s ? { borderColor: STATUS_COLORS[s]?.dot, color: STATUS_COLORS[s]?.label, backgroundColor: `${STATUS_COLORS[s]?.dot}18` } : {}}
                                            onClick={() => setEditForm(f => ({ ...f, status: s }))}
                                        >
                                            <StatusDot status={s} size={7} />
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Marketplace */}
                            <div className={styles.editField}>
                                <label className={styles.editLabel}>Marketplace</label>
                                <div className={styles.editMarketplaceGrid}>
                                    {['Amazon', 'Flipkart', 'Myntra', 'Meesho', 'Ajio', 'Shopsy', 'Website', 'Direct'].map(mp => (
                                        <button
                                            key={mp}
                                            type="button"
                                            className={`${styles.marketplacePill} ${editForm.marketplace === mp ? styles.marketplacePillActive : ''}`}
                                            onClick={() => setEditForm(f => ({ ...f, marketplace: mp }))}
                                        >
                                            <MarketplaceLogo marketplace={mp} size={18} />
                                            <span>{mp}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Vertical */}
                            <div className={styles.editField}>
                                <label className={styles.editLabel}>Vertical</label>
                                <select
                                    className={styles.editSelect}
                                    value={editForm.vertical}
                                    onChange={e => setEditForm(f => ({ ...f, vertical: e.target.value }))}
                                >
                                    <option value="">Select vertical...</option>
                                    {verticals.map(v => (
                                        <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Inventory Items */}
                            <div className={styles.editField}>
                                <label className={styles.editLabel}>Inventory IDs</label>
                                <div className={styles.editInventoryTags}>
                                    {editForm.inventoryItems.map((id) => (
                                        <span key={id} className={styles.inventoryTag}>
                                            {id}
                                            <button
                                                type="button"
                                                className={styles.removeTagBtn}
                                                onClick={() => setEditForm(f => ({ ...f, inventoryItems: f.inventoryItems.filter(i => i !== id) }))}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {editForm.inventoryItems.length === 0 && (
                                        <span className={styles.inventoryTagEmpty}>No items selected</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className={styles.addTagBtn}
                                    onClick={openInventoryPicker}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Select from Inventory
                                </button>
                            </div>

                        </div>

                        <div className={styles.editModalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setEditingListing(null)}>Cancel</button>
                            <button className={styles.saveBtn} onClick={handleEditSave} disabled={editSaving}>
                                {editSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── INVENTORY PICKER MODAL ──────────────────────────── */}
            {showInventoryPicker && (
                <div className={styles.modalOverlay} style={{ zIndex: 1100 }} onClick={() => setShowInventoryPicker(false)}>
                    <div className={styles.inventoryPickerModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>Select Inventory</h2>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                                    {editForm.inventoryItems.length} selected
                                </p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setShowInventoryPicker(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className={styles.inventoryPickerSearch}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#64748b' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input
                                type="text"
                                placeholder="Search inventory ID..."
                                className={styles.inventoryPickerSearchInput}
                                value={inventoryPickerSearch}
                                onChange={e => setInventoryPickerSearch(e.target.value.toUpperCase())}
                                autoFocus
                            />
                            {inventoryPickerSearch && (
                                <button className={styles.pickerSearchClear} onClick={() => setInventoryPickerSearch('')}>×</button>
                            )}
                        </div>

                        <div className={styles.inventoryPickerGridContainer}>
                            <div className={styles.inventoryPickerGrid}>
                                {inventoryPickerLoading ? (
                                    <div className={styles.inventoryPickerLoading}>
                                        <div className={styles.spinner} />
                                        <p>Loading inventory...</p>
                                    </div>
                                ) : (() => {
                                    const filtered = inventoryPickerItems.filter(inv =>
                                        !inventoryPickerSearch || inv.inventoryId?.toUpperCase().includes(inventoryPickerSearch)
                                    );
                                    return filtered.length === 0 ? (
                                        <p className={styles.inventoryPickerEmpty}>No inventory items found.</p>
                                    ) : filtered.map(inv => {
                                        const isSelected = editForm.inventoryItems.includes(inv.inventoryId);
                                        return (
                                            <div
                                                key={inv.inventoryId}
                                                className={`${styles.inventoryPickerCard} ${isSelected ? styles.inventoryPickerCardSelected : ''}`}
                                                onClick={() => toggleInventoryItem(inv.inventoryId)}
                                            >
                                                <div className={styles.inventoryPickerImageWrap}>
                                                    {inv.imageUrl ? (
                                                        <Image
                                                            src={inv.imageUrl}
                                                            alt={inv.inventoryId}
                                                            referrerPolicy="no-referrer"
                                                            fill
                                                            className={styles.inventoryPickerImage}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className={styles.inventoryPickerNoImage}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className={styles.inventoryPickerCheckmark}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={styles.inventoryPickerCardId}>{inv.inventoryId}</p>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        <div className={styles.inventoryPickerFooter}>
                            <span className={styles.inventoryPickerCount}>
                                {editForm.inventoryItems.length} item{editForm.inventoryItems.length !== 1 ? 's' : ''} selected
                            </span>
                            <button className={styles.saveBtn} onClick={() => setShowInventoryPicker(false)}>
                                Done
                            </button>
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
