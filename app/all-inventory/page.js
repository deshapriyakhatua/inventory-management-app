"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function AllInventoryPage() {
    const [inventory, setInventory] = useState([]);
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

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        fetchInventory(currentPage);
    }, [currentPage, sortOrder, selectedVertical]);

    // Handle Search explicitly on button click or enter
    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setCurrentPage(1);
            fetchInventory(1);
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

    const fetchInventory = async (page) => {
        setLoading(true);
        setMessage({ text: "", type: "" });
        const pin = sessionStorage.getItem("app_pin");
        
        const payload = {
            pin,
            action: "getInventory",
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
                // The getInventory response structure usually returns an array directly on data or within pagination blocks.
                // Looking at add-inventory, it returns result.data as an array. Let's assume there's pagination info or just the array.
                // Real pagination from getSalesLog was: data: { sales: [], pagination: { totalItems: X } }
                // For getInventory, add-inventory treats result.data as the array itself. We'll handle both cases to be safe.
                if (Array.isArray(response.data)) {
                    setInventory(response.data);
                    // If no totalItems provided, we guess based on whether we hit the pageSize limit
                    setTotalItems(response.data.length === pageSize ? page * pageSize + 1 : page * pageSize); 
                } else if (response.data && Array.isArray(response.data.items)) {
                    setInventory(response.data.items);
                    setTotalItems(response.data.pagination?.totalItems || 0);
                } else {
                    setInventory([]);
                }
            } else {
                setMessage({ text: response.message || "Failed to load inventory.", type: "error" });
                setInventory([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setMessage({ text: "Network error while loading data.", type: "error" });
            setInventory([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
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
                    <p>Loading Inventory...</p>
                </div>
            ) : inventory.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No inventory items found.</p>
                </div>
            ) : (
                <div className={styles.contentArea}>
                    {viewMode === 'grid' ? (
                        <div className={styles.gridContainer}>
                            {inventory.map((item) => (
                                <div key={item.id} className={styles.gridCard}>
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
                                    </div>
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
                            disabled={inventory.length < pageSize} 
                        >
                            Next
                        </button>
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
