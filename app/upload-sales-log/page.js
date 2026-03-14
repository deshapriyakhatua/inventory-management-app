"use client";

import React, { useState, useRef, useCallback } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { parseCSV } from "../../utils/csvParser";

export default function UploadSalesLog() {
    const [marketplace, setMarketplace] = useState("Flipkart");
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [duplicateIdentifiers, setDuplicateIdentifiers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const flipkartMapper = (row) => ({
        orderedOn: row['Ordered On'],
        orderId: row['Order Id'],
        orderItemId: row['ORDER ITEM ID']?.replace(/^'/, ''), // Clean the ' prefix
        sku: row['SKU'],
        quantity: Number(row['Quantity']) || 0,
    });

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = async (selectedFile) => {
        if (!selectedFile.name.endsWith('.csv')) {
            setMessage({ text: "Please select a valid CSV file.", type: "error" });
            return;
        }

        setFile(selectedFile);
        setDuplicateIdentifiers([]);
        setIsParsing(true);
        try {
            let data = [];
            if (marketplace === "Flipkart") {
                data = await parseCSV(selectedFile, flipkartMapper);
            } else {
                // Default parsing without mapper or with a generic one
                data = await parseCSV(selectedFile);
            }
            setParsedData(data);
            setMessage({ text: `Parsed ${data.length} rows successfully.`, type: "success" });
        } catch (error) {
            console.error("Parsing error:", error);
            setMessage({ text: "Failed to parse CSV file.", type: "error" });
            setFile(null);
            setParsedData([]);
        } finally {
            setIsParsing(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
        setParsedData([]);
        setDuplicateIdentifiers([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeRow = (index) => {
        setParsedData(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!file || parsedData.length === 0) {
            setMessage({ text: "No data to submit.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        const pin = sessionStorage.getItem("app_pin");

        // Map parsed data to the API format
        const salesItems = parsedData.map(item => ({
            skuId: item.sku,
            quantity: item.quantity,
            orderId: item.orderId,
            lineId: item.orderItemId, // Using Order Item ID as Line ID for Flipkart
            orderDate: item.orderedOn, // We might need to format this date string depending on API expectations
            dispatchDate: "", // Not available in simple Flipkart sales report
            status: "ORDERED"
        })).filter(item => item.skuId && item.quantity > 0);

        if (salesItems.length === 0) {
            setMessage({ text: "No valid sales items found in the file.", type: "error" });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            pin,
            action: "bulkRecordSales",
            salesItems
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(r => r.json());

            if (response.status === 200) {
                setMessage({ text: response.message || `Successfully uploaded ${salesItems.length} records.`, type: "success" });
                removeFile();
            } else if (response.status === 422 && response.data && typeof response.data === "object") {
                const err = response.data;
                let msg = err.message || "Update cancelled.";
                
                if (err.duplicates?.length) {
                    msg += ` Found ${err.duplicates.length} duplicates.`;
                    // Parse duplicate identifiers for highlighting
                    const dupIds = err.duplicates.map(str => {
                        const match = str.match(/Order: ([^,]+), Line: (.*)$/);
                        return match ? `${match[1]}|${match[2]}` : null;
                    }).filter(Boolean);
                    setDuplicateIdentifiers(dupIds);
                }
                
                if (err.invalidStatuses?.length) msg += ` Invalid statuses: ${err.invalidStatuses.join(" | ")}`;
                setMessage({ text: msg, type: "error" });
            } else {
                console.log("Error Response:", response);
                setMessage({ text: response.message || "Failed to upload data.", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Network error occurred.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Bulk Sales Upload</h1>

            <div className={styles.card}>
                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Select Marketplace</label>
                    <select 
                        className={styles.select} 
                        value={marketplace} 
                        onChange={(e) => setMarketplace(e.target.value)}
                    >
                        <option value="Flipkart">Flipkart</option>
                        {/* More marketplaces can be added here */}
                    </select>
                </div>

                <div 
                    className={`${styles.uploadArea} ${isDragging ? styles.dragging : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: "none" }} 
                        accept=".csv"
                        onChange={handleFileSelect}
                    />
                    
                    <div className={styles.uploadIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    
                    <div className={styles.uploadText}>
                        {isParsing ? "Parsing file..." : "Click to upload or drag & drop CSV file"}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        Supports Flipkart Sales Report Format
                    </div>
                </div>

                {file && (
                    <div className={styles.fileInfo}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button className={styles.removeFile} onClick={(e) => { e.stopPropagation(); removeFile(); }} title="Remove file">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}

                <div className={styles.actions}>
                    <button 
                        className={styles.submitBtn} 
                        onClick={handleSubmit} 
                        disabled={!file || parsedData.length === 0 || isSubmitting || isParsing}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className={styles.spinning} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="2" x2="12" y2="6"></line>
                                    <line x1="12" y1="18" x2="12" y2="22"></line>
                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                    <line x1="2" y1="12" x2="6" y2="12"></line>
                                    <line x1="18" y1="12" x2="22" y2="12"></line>
                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                </svg>
                                Uploading...
                            </>
                        ) : `Submit ${parsedData.length > 0 ? parsedData.length : ""} Records`}
                    </button>
                </div>
            </div>

            {parsedData.length > 0 && (
                <div className={styles.preview}>
                    <div className={styles.previewHeader}>
                        <h2 className={styles.previewTitle}>Data Preview (First 50 rows)</h2>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{parsedData.length} records found</span>
                    </div>
                    <div className={styles.previewTableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Order Date</th>
                                    <th>Order ID</th>
                                    <th>SKU</th>
                                    <th>Quantity</th>
                                    <th style={{ width: "40px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.slice(0, 50).map((item, idx) => {
                                    const isDuplicate = duplicateIdentifiers.includes(`${item.orderId}|${item.orderItemId}`);
                                    return (
                                        <tr key={idx} className={isDuplicate ? styles.duplicateRow : ""}>
                                            <td>{item.orderedOn}</td>
                                            <td>{item.orderId}</td>
                                            <td>{item.sku}</td>
                                            <td>{item.quantity}</td>
                                            <td>
                                                <button 
                                                    className={styles.removeRowBtn} 
                                                    onClick={() => removeRow(idx)}
                                                    title="Remove this record"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6l-1 14H6L5 6"></path>
                                                        <path d="M10 11v6M14 11v6"></path>
                                                        <path d="M9 6V4h6v2"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Toast message={message} onClose={() => setMessage({ text: "", type: "" })} />
        </div>
    );
}
