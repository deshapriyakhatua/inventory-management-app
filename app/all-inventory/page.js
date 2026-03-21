"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { fetchVerticalsData } from "../../utils/apiUtils";

export default function AllInventoryPage() {
    const [allInventoryData, setAllInventoryData] = useState([]); // All data from API/Local Storage
    const [inventory, setInventory] = useState([]); // Currently displayed filtered/paginated data
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [pageSize, setPageSize] = useState(100);

    // Filter/Sort States
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [selectedVertical, setSelectedVertical] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null); // For expander modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadInitialData();
        fetchInventory(false); // Try loading from local storage first
    }, []);

    // Apply Filters, Sort, and Pagination locally whenever dependencies change
    useEffect(() => {
        processLocalData();
    }, [allInventoryData, currentPage, sortOrder, selectedVertical, searchQuery, pageSize]);

    const processLocalData = () => {
        let filtered = [...allInventoryData];

        // 1. Filter by vertical
        if (selectedVertical) {
            filtered = filtered.filter(item => item.vertical === selectedVertical);
        }

        // 2. Filter by Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.id.toLowerCase().includes(query)
            );
        }

        // 3. Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0).getTime();
            const dateB = new Date(b.timestamp || 0).getTime();

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
        fetchInventory(true); // Force fetch from server
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        const id = itemToDelete;
        setDeletingItemId(id);
        setDeleteButtonLoading(true);
        const payload = {
            pin: sessionStorage.getItem("app_pin"), // Authenticate
            action: "deleteInventory",
            id: id,
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.status === 200) {
                setMessage({ text: "Inventory deleted successfully.", type: "success" });
                // Update local data
                const updatedData = allInventoryData.filter(item => item.id !== id);
                setAllInventoryData(updatedData);
                localStorage.setItem("all_inventory_data", JSON.stringify(updatedData));
            } else {
                console.error("API Error:", result.message);
                setMessage({ text: result.message || "Failed to delete inventory.", type: "error" });
            }
        } catch (error) {
            console.error("Network Error:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingItemId(null);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
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

    const fetchInventory = async (forceRefresh = false) => {
        const pin = sessionStorage.getItem("app_pin");

        // Check local storage if not forcing refresh
        if (!forceRefresh) {
            const cachedData = localStorage.getItem("all_inventory_data");
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setAllInventoryData(parsed);
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error("Failed to parse cached inventory");
                }
            }
        }

        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setMessage({ text: "", type: "" });

        const payload = {
            pin,
            action: "getInventory",
            page: 1,
            pageSize: 50000, // Fetch everything unconditionally
            sort: "newest_first", // Fetch in predictable order
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(res => res.json());

            if (response.status === 200) {
                let fetchedData = [];
                if (Array.isArray(response.data)) {
                    fetchedData = response.data;
                } else if (response.data && Array.isArray(response.data.items)) {
                    fetchedData = response.data.items;
                }
                setAllInventoryData(fetchedData);
                localStorage.setItem("all_inventory_data", JSON.stringify(fetchedData));

                if (forceRefresh) {
                    setMessage({ text: "Inventory refreshed successfully.", type: "success" });
                }
            } else {
                setMessage({ text: response.message || "Failed to load inventory.", type: "error" });
                if (!allInventoryData.length) setAllInventoryData([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setMessage({ text: "Network error while loading data.", type: "error" });
            if (!allInventoryData.length) setAllInventoryData([]);
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
                <h1 className={styles.title}>All Inventory</h1>

                <div className={styles.controlsRow}>
                    <div className={styles.filtersGroup}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Search Inventory ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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
                <div className={styles.loadingContainer} style={{ flex: 1 }}>
                    <div className={styles.spinner}></div>
                    <p>Loading Inventory...</p>
                </div>
            ) : inventory.length === 0 ? (
                <div className={styles.emptyState} style={{ flex: 1 }}>
                    <p>No inventory items found.</p>
                </div>
            ) : (
                <div className={styles.contentArea}>
                    <div className={styles.scrollWrapper}>
                        {viewMode === 'grid' ? (
                            <div className={styles.gridContainer}>
                                {inventory.map((item) => (
                                    <div key={item.id} className={styles.gridCard}>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            className={styles.deleteBtn}
                                            title="Delete Inventory"
                                            disabled={deleteButtonLoading}
                                        >
                                            {deleteButtonLoading && deletingItemId === item.id
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
                                        <div className={styles.imageContainer}>
                                            {item.driveId ? (
                                                <Image
                                                    src={`https://drive.google.com/thumbnail?id=${item.driveId}&sz=w300`}
                                                    alt={item.id}
                                                    referrerPolicy="no-referrer"
                                                    fill
                                                    className={styles.itemImage}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className={styles.imagePlaceholder}>No Image</div>
                                            )}
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.skuHeaderRow}>
                                                <p className={styles.itemId} title={item.id}>{item.id}</p>
                                                <button
                                                    className={styles.smallCopyBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(item.id, "Inventory ID");
                                                    }}
                                                    title="Copy ID"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className={styles.itemDate}>
                                                {new Date(item.timestamp).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </p>
                                            <div className={styles.stockBadge}>
                                                <span className={styles.stockLabel}>Stock:</span>
                                                <span className={`${styles.stockValue} ${item.inventoryMetrics?.currentStock <= 10 ? styles.lowStock : ''}`}>
                                                    {item.inventoryMetrics?.currentStock ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className={styles.clickableOverlay}
                                            onClick={() => setSelectedItem(item)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.listContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Inventory/SKU ID</th>
                                            <th>Date Added</th>
                                            <th>Actions</th>
                                            <th>Stock</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.map((item) => (
                                            <tr key={item.id} className={styles.tableRow}>
                                                <td className={styles.tdImage}>
                                                    {item.driveId ? (
                                                        <div className={styles.listThumbnailContainer}>
                                                            <Image
                                                                src={`https://drive.google.com/thumbnail?id=${item.driveId}&sz=w100`}
                                                                alt={item.id}
                                                                referrerPolicy="no-referrer"
                                                                fill
                                                                className={styles.listThumbnail}
                                                                unoptimized
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className={styles.listThumbnailPlaceholder}>-</div>
                                                    )}
                                                </td>
                                                <td className={styles.tdId}>{item.id}</td>
                                                <td className={styles.tdDate}>
                                                    {new Date(item.timestamp).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className={styles.tdActions}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id)}
                                                        className={styles.listDeleteBtn}
                                                        title="Delete Inventory"
                                                        disabled={deleteButtonLoading}
                                                    >
                                                        {deleteButtonLoading && deletingItemId === item.id
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
                                                <td className={styles.tdStock}>
                                                    <span className={`${styles.tableStockValue} ${item.inventoryMetrics?.currentStock <= 10 ? styles.lowStock : ''}`}>
                                                        {item.inventoryMetrics?.currentStock ?? 0}
                                                    </span>
                                                </td>
                                                <td className={styles.tdView}>
                                                    <button
                                                        className={styles.viewDetailsBtn}
                                                        onClick={() => setSelectedItem(item)}
                                                    >
                                                        View Details
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

            <Toast
                message={message}
                onClose={() => setMessage({ text: "", type: "" })}
            />

            {showDeleteConfirm && (
                <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={styles.warningIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                            </div>
                            <h3 className={styles.confirmTitle}>Confirm Deletion</h3>
                        </div>
                        <p className={styles.confirmMessage}>
                            Are you sure you want to delete this inventory item? This action cannot be undone.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteButtonLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={confirmDelete}
                                disabled={deleteButtonLoading}
                            >
                                {deleteButtonLoading ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedItem && (
                <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setSelectedItem(null)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <div className={styles.modalScrollArea}>
                            <div className={styles.modalHeader}>
                                <div className={styles.modalImageContainer}>
                                    {selectedItem.driveId ? (
                                        <Image
                                            src={`https://drive.google.com/thumbnail?id=${selectedItem.driveId}&sz=w600`}
                                            alt={selectedItem.id}
                                            referrerPolicy="no-referrer"
                                            fill
                                            className={styles.modalImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className={styles.modalImagePlaceholder}>No Image</div>
                                    )}
                                </div>
                                <div className={styles.modalMainInfo}>
                                    <div className={styles.idWithCopy}>
                                        <h2 className={styles.modalId}>{selectedItem.id}</h2>
                                        <button
                                            className={styles.copyButton}
                                            onClick={() => copyToClipboard(selectedItem.id, "Inventory ID")}
                                            title="Copy ID"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <p className={styles.modalVertical}>{selectedItem.vertical}</p>
                                    <p className={styles.modalDate}>
                                        Added on {new Date(selectedItem.timestamp).toLocaleString('en-US', {
                                            month: 'long', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.metricsGrid}>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Initial Stock</span>
                                    <span className={styles.metricValue}>{selectedItem.inventoryMetrics?.initialStock ?? 0}</span>
                                </div>
                                <div className={`${styles.metricCard} ${styles.highlightMetric}`}>
                                    <span className={styles.metricLabel}>Current Stock</span>
                                    <span className={styles.metricValue}>{selectedItem.inventoryMetrics?.currentStock ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Gross Ordered</span>
                                    <span className={styles.metricValue}>{selectedItem.inventoryMetrics?.grossOrdered ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Net Sold</span>
                                    <span className={styles.metricValue}>{selectedItem.inventoryMetrics?.netSold ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Cancelled</span>
                                    <span className={styles.metricValue}>{selectedItem.inventoryMetrics?.cancelled ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Returned</span>
                                    <span className={styles.metricValue}>{selectedItem.inventoryMetrics?.returned ?? 0}</span>
                                </div>
                            </div>

                            {/* SKUs Section */}
                            {selectedItem.skus && selectedItem.skus.length > 0 && (
                                <div className={styles.modalSection}>
                                    <h3 className={styles.sectionTitle}>Associated SKUs</h3>
                                    <div className={styles.skuGrid}>
                                        {selectedItem.skus.map((sku, index) => (
                                            <div key={index} className={styles.skuCard}>
                                                <div className={styles.skuInfo}>
                                                    <div className={styles.skuMain}>
                                                        <span className={styles.skuIdLabel}>SKU ID</span>
                                                        <div className={styles.skuIdWithCopy}>
                                                            <span className={styles.skuIdValue}>{sku.skuId}</span>
                                                            <button
                                                                className={styles.copyButtonSmall}
                                                                onClick={() => copyToClipboard(sku.skuId, "SKU ID")}
                                                                title="Copy SKU ID"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className={styles.skuMarketplace}>
                                                        <span className={styles.marketplaceBadge}>{sku.marketplace}</span>
                                                    </div>
                                                </div>

                                                {/* Combo Items */}
                                                {sku.comboItems && sku.comboItems.length > 0 && (
                                                    <div className={styles.comboSection}>
                                                        <span className={styles.comboLabel}>Combo Items</span>
                                                        <div className={styles.comboGrid}>
                                                            {sku.comboItems.map((combo, cIndex) => (
                                                                <div key={cIndex} className={styles.comboItem}>
                                                                    <div className={styles.comboImageWrapper}>
                                                                        {combo.driveId ? (
                                                                            <Image
                                                                                src={`https://drive.google.com/thumbnail?id=${combo.driveId}&sz=w300`}
                                                                                alt={combo.id}
                                                                                fill
                                                                                className={styles.comboImg}
                                                                                unoptimized
                                                                            />
                                                                        ) : (
                                                                            <div className={styles.comboPlaceholder}>NA</div>
                                                                        )}
                                                                    </div>
                                                                    <div className={styles.comboIdContainer}>
                                                                        <span className={styles.comboId}>{combo.id}</span>
                                                                        <button
                                                                            className={styles.copyButtonTiny}
                                                                            onClick={() => copyToClipboard(combo.id, "Combo Inventory ID")}
                                                                            title="Copy ID"
                                                                        >
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
