"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function SalesRecordsPage() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 20;
    
    // Filters & Sorting
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchSalesRecords(false);
    }, []);

    // Local processing
    useEffect(() => {
        processLocalData();
    }, [records, currentPage, sortOrder]);

    const processLocalData = () => {
        let filtered = [...records];
        
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0).getTime();
            const dateB = new Date(b.createdAt || b.date || 0).getTime();
            
            if (sortOrder === "newest_first") {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        setTotalItems(filtered.length);
    };

    const fetchSalesRecords = async (forceRefresh = false) => {
        const pin = sessionStorage.getItem("app_pin");
        
        if (!forceRefresh) {
            const cachedData = localStorage.getItem("all_sales_data");
            if (cachedData) {
                try {
                    setRecords(JSON.parse(cachedData));
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error("Failed to parse cached sales");
                }
            }
        }

        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        const payload = {
            pin,
            action: "getSalesLog",
            page: 1,
            pageSize: 50000,
            sort: "newest_first"
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(res => res.json());

            if (response.status === 200 && response.message) {
                const fetchedData = response.message.sales || [];
                setRecords(fetchedData);
                localStorage.setItem("all_sales_data", JSON.stringify(fetchedData));
                
                if (forceRefresh) {
                    setMessage({ text: "Records refreshed successfully.", type: "success" });
                }
            } else {
                setMessage({ text: response.message || "Failed to load records.", type: "error" });
                if (!records.length) setRecords([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setMessage({ text: "Network error fetching records.", type: "error" });
            if (!records.length) setRecords([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchSalesRecords(true);
    };

    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Helper to format Date if the API starts returning a date field, fallback to N/A
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sales & Returns Log</h1>
                
                <div className={styles.filtersRow}>
                    <select 
                        className={styles.filterSelect}
                        value={sortOrder}
                        onChange={(e) => {
                            setSortOrder(e.target.value);
                            setCurrentPage(1); // Reset page on sort change
                        }}
                    >
                        <option value="newest_first">Newest First</option>
                        <option value="oldest_first">Oldest First</option>
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

            <div className={styles.card}>
                <div className={styles.tableContainer}>
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p>Loading records...</p>
                        </div>
                    ) : records.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Order ID</th>
                                    <th>SKU ID</th>
                                    <th>Quantity</th>
                                    <th>Vertical</th>
                                    <th>Platform</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((record, index) => (
                                    <tr key={`${record.orderId}-${record.skuId}-${index}`}>
                                        <td>{formatDate(record.createdAt || record.date)}</td>
                                        <td className={styles.highlightText}>{record.orderId || "N/A"}</td>
                                        <td className={styles.skuText}>{record.skuId}</td>
                                        <td>{record.quantity}</td>
                                        <td>{record.vertical || "N/A"}</td>
                                        <td>{record.platform || "N/A"}</td>
                                        <td>
                                            <span className={`${styles.badge} ${record.type?.toLowerCase() === 'sale' ? styles.badgeSuccess : styles.badgeDanger}`}>
                                                {record.type || "Sale"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.emptyState}>No records found.</div>
                    )}
                </div>

                {!loading && records.length > 0 && (
                    <div className={styles.pagination}>
                        <span className={styles.pageInfo}>
                            Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                        </span>
                        <div className={styles.pageControls}>
                            <button 
                                className={styles.pageBtn} 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                Previous
                            </button>
                            <span className={styles.pageDisplay}>Page {currentPage} of {totalPages}</span>
                            <button 
                                className={styles.pageBtn} 
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Toast 
                message={message} 
                onClose={() => setMessage({ text: "", type: "" })} 
            />
        </div>
    );
}
