"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function AllListingsPage() {
    const [listings, setListings] = useState([]);
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [message, setMessage] = useState({ text: "", type: "" });
    const pageSize = 20;

    // Filter/Sort States
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [selectedVertical, setSelectedVertical] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [selectedListing, setSelectedListing] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        fetchListings(currentPage);
    }, [currentPage, sortOrder, selectedVertical]);

    // Handle Search explicitly on button click or enter
    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setCurrentPage(1);
            fetchListings(1);
        }
    };

    const handleReset = () => {
        setSearchQuery("");
        setSelectedVertical("");
        setSortOrder("newest_first");
        setCurrentPage(1);
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
            const vertPayload = { pin, action: "getVertical", pageSize: 100, sort: "name_asc" };
            const vertRes = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST", body: JSON.stringify(vertPayload)
            }).then(res => res.json());
            
            if (vertRes.status === 200) {
                setVerticals(vertRes.data || []);
            }
        } catch (error) {
            console.error("Failed to load verticals:", error);
        }
    };

    const fetchListings = async (page) => {
        setLoading(true);
        setMessage({ text: "", type: "" });
        const pin = sessionStorage.getItem("app_pin");
        
        const payload = {
            pin,
            action: "getListing",
            page: page,
            pageSize: pageSize,
            sort: sortOrder,
        };

        if (selectedVertical) payload.vertical = selectedVertical;
        if (searchQuery) payload.search = searchQuery;

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(res => res.json());

            if (response.status === 200) {
                if (response.message && Array.isArray(response.message.listings)) {
                    setListings(response.message.listings);
                    setTotalItems(response.message.pagination?.totalItems || 0);
                } else if (Array.isArray(response.data)) {
                    setListings(response.data);
                    setTotalItems(response.data.length === pageSize ? page * pageSize + 1 : page * pageSize);
                } else {
                    setListings([]);
                }
            } else {
                setMessage({ text: response.message || "Failed to load listings.", type: "error" });
                setListings([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setMessage({ text: "Network error while loading data.", type: "error" });
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>All Listings</h1>
                
                <div className={styles.controlsRow}>
                    <div className={styles.filtersGroup}>
                        <div className={styles.searchBox}>
                            <input 
                                type="text"
                                placeholder="Search SKU ID..."
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
                    {viewMode === 'grid' ? (
                        <div className={styles.gridContainer}>
                            {listings.map((item) => {
                                const validImages = item.inventoryItems?.filter(inv => inv.imageId) || [];
                                const displayImages = validImages.slice(0, 4);

                                return (
                                    <div 
                                        key={item.skuId} 
                                        className={styles.gridCard}
                                        onClick={() => setSelectedListing(item)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.imageContainer} data-count={displayImages.length}>
                                            {displayImages.length > 0 ? (
                                                displayImages.map((inv, idx) => (
                                                    <div key={idx} className={styles.multiImageCell}>
                                                        <Image
                                                            src={`https://drive.google.com/thumbnail?id=${inv.imageId}&sz=w300`}
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
                                                    <br/>No Images
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <p className={styles.itemId}>{item.skuId}</p>
                                            <p className={styles.itemDate}>
                                                {item.vertical}
                                            </p>
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
                                        <th>Date Created</th>
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
                                                            inv.imageId ? (
                                                                <div key={idx} className={styles.listThumbnailContainer}>
                                                                    <Image
                                                                        src={`https://drive.google.com/thumbnail?id=${inv.imageId}&sz=w100`}
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
                                            <td className={styles.tdId}>{item.skuId}</td>
                                            <td className={styles.tdVertical}>{item.vertical}</td>
                                            <td className={styles.tdDate}>
                                                {new Date(item.createdAt).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className={styles.pagination}>
                        <button 
                            className={styles.pageBtn} 
                            onClick={handlePrevPage} 
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className={styles.pageInfo}>Page {currentPage}</span>
                        <button 
                            className={styles.pageBtn} 
                            onClick={handleNextPage}
                            disabled={listings.length < pageSize} 
                        >
                            Next
                        </button>
                    </div>
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
                                                    {inv.imageId ? (
                                                        <Image
                                                            src={`https://drive.google.com/thumbnail?id=${inv.imageId}&sz=w300`}
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
