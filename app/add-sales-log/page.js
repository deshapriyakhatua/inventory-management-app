"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { fetchVerticalsData } from "../../utils/apiUtils";

export default function AddSalesLog() {
    const [listings, setListings] = useState([]);
    const [verticals, setVerticals] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    
    const [searchSku, setSearchSku] = useState("");
    const [selectedVertical, setSelectedVertical] = useState("");
    
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    
    // Action Form
    const [actionType, setActionType] = useState("sales"); // "sales" or "returns"
    const [selectedItems, setSelectedItems] = useState([]);
    
    // Expandable Rows
    const [expandedListingId, setExpandedListingId] = useState(null);
    
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoadingData(true);
        const pin = sessionStorage.getItem("app_pin");
        
        try {
            // Fetch Verticals
            const cachedVerticals = await fetchVerticalsData(pin);
            setVerticals(cachedVerticals || []);
            
            // Try loading listings from cache
            const cachedListings = localStorage.getItem("all_listings_data");
            if (cachedListings) {
                try {
                    setListings(JSON.parse(cachedListings));
                    setLoadingData(false);
                    return;
                } catch (e) {
                    console.error("Failed to parse cached listings", e);
                }
            }
            
            // If no cache, fetch from API
            await fetchListingsData(false);
        } catch (error) {
            console.error("Error loading data:", error);
            setMessage({ text: "Failed to load initial data.", type: "error" });
            setLoadingData(false);
        }
    };

    const fetchListingsData = async (forceRefresh = false) => {
        const pin = sessionStorage.getItem("app_pin");
        
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoadingData(true);
        }

        try {
            const listPayload = { pin, action: "getListing", page: 1, pageSize: 50000, sort: "newest_first" };
            const listRes = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST", body: JSON.stringify(listPayload)
            }).then(res => res.json());
            
            if (listRes.status === 200) {
                let fetchedData = [];
                if (listRes.message && Array.isArray(listRes.message.listings)) {
                    fetchedData = listRes.message.listings;
                } else if (Array.isArray(listRes.data)) {
                    fetchedData = listRes.data;
                }
                setListings(fetchedData);
                localStorage.setItem("all_listings_data", JSON.stringify(fetchedData));

                if (forceRefresh) {
                    setMessage({ text: "Listings refreshed successfully.", type: "success" });
                }
            } else {
                if (!listings.length) setListings([]);
            }
        } catch (error) {
            console.error("Error fetching listings:", error);
            setMessage({ text: "Failed to fetch listings.", type: "error" });
        } finally {
            setLoadingData(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchListingsData(true);
    };

    // Derived states for Listing Browser
    const filteredListings = listings.filter(item => {
        const matchSku = item.skuId?.toLowerCase().includes(searchSku.toLowerCase());
        const matchVert = selectedVertical ? item.vertical === selectedVertical : true;
        return matchSku && matchVert;
    });

    const totalPages = Math.ceil(filteredListings.length / pageSize) || 1;
    const paginatedListings = filteredListings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset to page 1 if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchSku, selectedVertical]);
    
    // Selection Handlers
    const isSelected = (skuId) => selectedItems.some(item => item.skuId === skuId);
    
    const toggleSelection = (skuId) => {
        if (isSelected(skuId)) {
            setSelectedItems(prev => prev.filter(item => item.skuId !== skuId));
        } else {
            setSelectedItems(prev => [...prev, {
                skuId,
                quantity: 1,
                orderId: "",
                platform: "Amazon"
            }]);
        }
    };
    
    const updateSelectedItem = (skuId, field, value) => {
        setSelectedItems(prev => prev.map(item => 
            item.skuId === skuId ? { ...item, [field]: value } : item
        ));
    };

    const toggleExpand = (skuId) => {
        if (expandedListingId === skuId) {
            setExpandedListingId(null);
        } else {
            setExpandedListingId(skuId);
        }
    };

    // Submit Handler
    const handleSubmit = async () => {
        // Validation
        if (selectedItems.length === 0) {
            setMessage({ text: "Please select at least one item.", type: "error" });
            return;
        }

        // Validate fields
        for (const item of selectedItems) {
            if (!item.quantity || Number(item.quantity) <= 0) {
                setMessage({ text: `Invalid quantity for SKU: ${item.skuId}`, type: "error" });
                return;
            }
            if (!item.orderId || !item.orderId.trim()) {
                setMessage({ text: `Order ID is required for SKU: ${item.skuId}`, type: "error" });
                return;
            }
        }

        setIsSubmitting(true);
        const pin = sessionStorage.getItem("app_pin");
        
        let payload = { pin };
        
        if (actionType === "sales") {
            payload.action = "bulkRecordSales";
            payload.salesItems = selectedItems.map(item => ({
                skuId: item.skuId,
                quantity: Number(item.quantity),
                orderId: item.orderId,
                platform: item.platform
            }));
        } else {
            payload.action = "bulkRecordReturns";
            payload.returnItems = selectedItems.map(item => ({
                skuId: item.skuId,
                quantity: Number(item.quantity),
                orderId: item.orderId,
                platform: item.platform
            }));
        }

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(res => res.json());

            if (response.status === 200) {
                setMessage({ text: `Successfully recorded ${actionType} for ${selectedItems.length} items.`, type: "success" });
                setSelectedItems([]);
            } else {
                setMessage({ text: response.message || "Failed to submit data.", type: "error" });
            }
        } catch (error) {
            console.error("Submit Error:", error);
            setMessage({ text: "Network error occurred.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Add Sales & Returns Log</h1>
            
            <div className={styles.layout}>
                {/* Upper Section: Listing Browser */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Listing Browser</h2>
                    
                    <div className={styles.filtersRow}>
                        <input 
                            type="text" 
                            placeholder="Search by SKU ID..." 
                            value={searchSku}
                            onChange={(e) => setSearchSku(e.target.value)}
                            className={styles.filterInput}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                            <select 
                                value={selectedVertical} 
                                onChange={(e) => setSelectedVertical(e.target.value)}
                                className={styles.filterSelect}
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                <option value="">All Verticals</option>
                                {verticals.map(v => (
                                    <option key={v.verticalShort} value={v.verticalName}>
                                        {v.verticalName}
                                    </option>
                                ))}
                            </select>

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
                            </button>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        {loadingData ? (
                            <div className={styles.loading}>Loading listings...</div>
                        ) : filteredListings.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th style={{ width: '40px' }}>Select</th>
                                        <th>SKU ID</th>
                                        <th>Vertical</th>
                                        <th>Thumbnails</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedListings.map(item => (
                                        <React.Fragment key={item.skuId}>
                                            <tr 
                                                className={styles.clickableRow}
                                                onClick={() => toggleSelection(item.skuId)}
                                            >
                                                <td onClick={(e) => { e.stopPropagation(); toggleExpand(item.skuId); }}>
                                                    <button className={styles.expandBtn} type="button">
                                                        {expandedListingId === item.skuId ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                        ) : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                        )}
                                                    </button>
                                                </td>
                                                <td>
                                                    <input 
                                                        type="checkbox" 
                                                        className={styles.checkbox}
                                                        checked={isSelected(item.skuId)}
                                                        onChange={() => toggleSelection(item.skuId)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className={styles.skuCell}>{item.skuId}</td>
                                                <td>{item.vertical}</td>
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
                                            </tr>
                                            {expandedListingId === item.skuId && (
                                                <tr className={styles.expandedRow}>
                                                    <td colSpan="5" className={styles.expandedCell}>
                                                        <div className={styles.expandedContent}>
                                                            <h4 className={styles.expandedTitle}>Associated Inventory ({item.inventoryItems?.length || 0})</h4>
                                                            {item.inventoryItems && item.inventoryItems.length > 0 ? (
                                                                <div className={styles.inventoryThumbGrid}>
                                                                    {item.inventoryItems.map(inv => (
                                                                        <div key={inv.inventoryId} className={styles.inventoryThumbCard}>
                                                                            {inv.imageId ? (
                                                                                <div className={styles.thumbImageWrapper}>
                                                                                    <Image
                                                                                        src={`https://drive.google.com/thumbnail?id=${inv.imageId}&sz=w150`}
                                                                                        alt={inv.inventoryId}
                                                                                        fill
                                                                                        style={{ objectFit: 'cover' }}
                                                                                        unoptimized
                                                                                        referrerPolicy="no-referrer"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div className={styles.thumbImagePlaceholder}>No Image</div>
                                                                            )}
                                                                            <span className={styles.thumbId}>{inv.inventoryId}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className={styles.noInventoryText}>No inventory items associated with this listing.</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>No listings found.</div>
                        )}
                    </div>

                    <div className={styles.pagination}>
                        <span className={styles.pageInfo}>
                            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredListings.length)} to {Math.min(currentPage * pageSize, filteredListings.length)} of {filteredListings.length} entries
                        </span>
                        <div className={styles.pageControls}>
                            <button 
                                className={styles.pageBtn} 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                Previous
                            </button>
                            <button 
                                className={styles.pageBtn} 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lower Section: Action Form */}
                <div className={styles.card}>
                    <div className={styles.actionHeader}>
                        <h2 className={styles.actionTitle}>Action Form ({selectedItems.length} selected)</h2>
                        <div className={styles.toggleGroup}>
                            <button 
                                className={`${styles.toggleBtn} ${actionType === 'sales' ? styles.activeSales : ''}`}
                                onClick={() => setActionType("sales")}
                            >
                                Record Sales
                            </button>
                            <button 
                                className={`${styles.toggleBtn} ${actionType === 'returns' ? styles.activeReturns : ''}`}
                                onClick={() => setActionType("returns")}
                            >
                                Record Returns
                            </button>
                        </div>
                    </div>

                    {selectedItems.length > 0 ? (
                        <div className={styles.selectedList}>
                            {selectedItems.map(item => (
                                <div key={item.skuId} className={styles.selectedItemCard}>
                                    <div className={styles.itemSku}>{item.skuId}</div>
                                    
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Quantity</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateSelectedItem(item.skuId, 'quantity', e.target.value)}
                                            className={styles.itemInput}
                                        />
                                    </div>
                                    
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Order ID</label>
                                        <input 
                                            type="text" 
                                            value={item.orderId}
                                            onChange={(e) => updateSelectedItem(item.skuId, 'orderId', e.target.value)}
                                            className={styles.itemInput}
                                            placeholder="Enter Order ID"
                                        />
                                    </div>
                                    
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Platform</label>
                                        <select 
                                            value={item.platform}
                                            onChange={(e) => updateSelectedItem(item.skuId, 'platform', e.target.value)}
                                            className={styles.itemSelect}
                                        >
                                            <option value="Amazon">Amazon</option>
                                            <option value="Flipkart">Flipkart</option>
                                            <option value="Myntra">Myntra</option>
                                            <option value="Meesho">Meesho</option>
                                            <option value="JioMart">JioMart</option>
                                            <option value="Own Site">Own Site</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        className={styles.removeBtn}
                                        onClick={() => toggleSelection(item.skuId)}
                                        title="Remove item"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            
                            <button 
                                className={`${styles.submitBtn} ${styles[actionType]}`}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : actionType === "sales" ? "Submit Sales Report" : "Submit Returns Report"}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            Select listings from the browser above to start adding {actionType}.
                        </div>
                    )}
                </div>
            </div>
            
            <Toast 
                message={message} 
                onClose={() => setMessage({ text: "", type: "" })} 
            />
        </div>
    );
}
