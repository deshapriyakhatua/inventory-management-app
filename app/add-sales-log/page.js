"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function AddSalesLog() {
    const [listings, setListings] = useState([]);
    const [verticals, setVerticals] = useState([]);
    
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
            const vertPayload = { pin, action: "getVertical", pageSize: 100, sort: "name_asc" };
            const vertRes = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST", body: JSON.stringify(vertPayload)
            }).then(res => res.json());
            
            if (vertRes.status === 200) {
                setVerticals(vertRes.data || []);
            }
            
            // Fetch Listings (get a large chunk for client-side filtering)
            const listPayload = { pin, action: "getListing", page: 1, pageSize: 200, sort: "newest_first" };
            const listRes = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST", body: JSON.stringify(listPayload)
            }).then(res => res.json());
            
            if (listRes.status === 200) {
                setListings(listRes.message?.listings || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setMessage({ text: "Failed to load initial data.", type: "error" });
        } finally {
            setLoadingData(false);
        }
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
                unitPrice: "",
                platform: "Amazon",
                reason: ""
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
            if (!item.unitPrice || Number(item.unitPrice) <= 0) {
                setMessage({ text: `Invalid unit price for SKU: ${item.skuId}`, type: "error" });
                return;
            }
            if (actionType === "returns" && !item.reason.trim()) {
                setMessage({ text: `Reason is required for returned SKU: ${item.skuId}`, type: "error" });
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
                unitPrice: Number(item.unitPrice),
                platform: item.platform
            }));
        } else {
            payload.action = "bulkRecordReturns";
            payload.returnItems = selectedItems.map(item => ({
                skuId: item.skuId,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                platform: item.platform,
                reason: item.reason
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
                        <select 
                            value={selectedVertical} 
                            onChange={(e) => setSelectedVertical(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">All Verticals</option>
                            {verticals.map(v => (
                                <option key={v.verticalShort} value={v.verticalName}>
                                    {v.verticalName}
                                </option>
                            ))}
                        </select>
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
                                        <th>Date Created</th>
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
                                                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
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
                                        <label className={styles.inputLabel}>Unit Price</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={item.unitPrice}
                                            onChange={(e) => updateSelectedItem(item.skuId, 'unitPrice', e.target.value)}
                                            className={styles.itemInput}
                                            placeholder="0.00"
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

                                    {actionType === "returns" && (
                                        <div className={styles.inputGroup} style={{ flex: 2 }}>
                                            <label className={styles.inputLabel}>Reason</label>
                                            <input 
                                                type="text" 
                                                value={item.reason}
                                                onChange={(e) => updateSelectedItem(item.skuId, 'reason', e.target.value)}
                                                className={styles.itemInput}
                                                placeholder="Enter reason for return..."
                                            />
                                        </div>
                                    )}
                                    
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
