"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState, useRef, useCallback } from "react";
import styles from "./page.module.css";

import { parseCSV } from "../../utils/csvParser";

export default function UploadSalesLog() {
    const [marketplace, setMarketplace] = useState("Flipkart");
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const flipkartMapper = (row) => {
        // Detection logic based on unique column headers
        const isOrderFile = row['Ordered On'] !== undefined;
        const isCancelledFile = row['Order Cancellation Date'] !== undefined;

        if (isOrderFile) {
            // Mapping for Order-CSV
            return {
                orderedOn: row['Ordered On'],
                orderId: row['Order Id']?.trim(),
                orderItemId: row['ORDER ITEM ID']?.replace(/^'/, '')?.trim(),
                sku: row['SKU']?.trim(),
                quantity: Number(row['Quantity']) || 0,
                status: row['Order State']?.trim(),
                originalStatus: row['Order State']?.trim()
            };
        } else if (isCancelledFile) {
            // Smart Status Logic: Logistics Return vs Cancelled
            const isLogisticsReturn = row['Logistics Return']?.trim().toLowerCase() === 'yes';

            return {
                orderedOn: row['Order Approval Date'],
                orderId: row['Order ID']?.trim(),
                orderItemId: row['Order Item ID']?.replace(/^'/, '')?.trim(),
                sku: row['SKU']?.trim(),
                quantity: Number(row['Quantity']) || 0,
                status: isLogisticsReturn ? undefined : 'CANCELLED',
                originalStatus: isLogisticsReturn ? undefined : 'CANCELLED'
            };
        }

        return null;
    };

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = async (selectedFile) => {
        if (!selectedFile.name.endsWith('.csv')) {
            toast.error("Please select a valid CSV file.", { id: "app-feedback", duration: 3000 });
            return;
        }

        setFile(selectedFile);
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
            toast.success(`Parsed ${data.length} rows successfully.`, { id: "app-feedback", duration: 3000 });
        } catch (error) {
            console.error("Parsing error:", error);
            toast.error("Failed to parse CSV file.", { id: "app-feedback", duration: 3000 });
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
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeRow = (index) => {
        setParsedData(prev => prev.filter((_, i) => i !== index));
    };
 
    const toggleRowStatus = (index) => {
        setParsedData(prev => prev.map((item, i) => {
            if (i !== index) return item;
            return {
                ...item,
                status: item.status === 'DISPATCHED' ? (item.originalStatus) : 'DISPATCHED'
            };
        }));
    };
 
    const toggleAllRows = (checked) => {
        setParsedData(prev => prev.map(item => ({
            ...item,
            status: checked ? 'DISPATCHED' : (item.originalStatus)
        })));
    };

    const handleSubmit = async () => {
        if (!file || parsedData.length === 0) {
            toast.error("No data to submit.", { id: "app-feedback", duration: 3000 });
            return;
        }

        setIsSubmitting(true);

        // Map parsed data to the API format
        const salesItems = parsedData.map(item => ({
            orderId: item.orderId,
            lineId: item.orderItemId,
            skuId: item.sku,
            quantity: item.quantity,
            status: item.status || null,
            orderedOn: item.orderedOn || null,
        })).filter(item => item.orderId && item.skuId && item.quantity > 0);

        if (salesItems.length === 0) {
            toast.error("No valid sales items found in the file.", { id: "app-feedback", duration: 3000 });
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await fetch("/api/employee/sales-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ marketplace, salesItems }),
            });
            const response = await res.json();

            if (res.ok && response.success) {
                const { inserted = 0, updated = 0, total = salesItems.length } = response;
                toast.success(`Upload complete: ${inserted} new, ${updated} updated (${total} total).`, { id: "app-feedback", duration: 3000 });
                removeFile();
            } else {
                toast.error(response.error || "Failed to upload data.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            toast.error("Network error occurred.", { id: "app-feedback", duration: 3000 });
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
                        <Icon name="icon-f583f931" size={48} />
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
                        <Icon name="pdf-preview" size={18} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button className={styles.removeFile} onClick={(e) => { e.stopPropagation(); removeFile(); }} title="Remove file">
                            <Icon name="remove-this-product" size={18} />
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
                                <Icon name="icon-9336224a" size={18} className={styles.spinning} />
                                Uploading...
                            </>
                        ) : `Submit ${parsedData.length > 0 ? parsedData.length : ""} Records`}
                    </button>
                </div>
            </div>

            {parsedData.length > 0 && (
                <div className={styles.preview}>
                    <div className={styles.previewHeader}>
                        <h2 className={styles.previewTitle}>Data Preview</h2>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{parsedData.length} records found</span>
                    </div>
                    <div className={styles.previewTableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.stickyColumn}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={parsedData.length > 0 && parsedData.every(item => item.status === 'DISPATCHED')}
                                            onChange={(e) => toggleAllRows(e.target.checked)}
                                            title={parsedData.every(item => item.status === 'DISPATCHED') ? "Revert all to original status" : "Mark all as Dispatched"}
                                        />
                                    </th>
                                    <th>Order Date</th>
                                    <th>Order ID</th>
                                    <th>Line ID</th>
                                    <th>SKU</th>
                                    <th>Quantity</th>
                                    <th>Status</th>
                                    <th style={{ width: "40px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.map((item, idx) => {
                                    return (
                                        <tr key={idx}>
                                            <td className={styles.stickyColumn}>
                                                <input
                                                    type="checkbox"
                                                    className={styles.checkbox}
                                                    checked={item.status === 'DISPATCHED'}
                                                    onChange={() => toggleRowStatus(idx)}
                                                    title={item.status === 'DISPATCHED' ? "Revert to original status" : "Mark as Dispatched"}
                                                />
                                            </td>
                                            <td>{item.orderedOn}</td>
                                            <td>{item.orderId}</td>
                                            <td>{item.orderItemId}</td>
                                            <td>{item.sku}</td>
                                            <td>{item.quantity}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[item.status?.toLowerCase() || 'ordered']}`}>
                                                    {item.status || 'NA'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.removeRowBtn}
                                                    onClick={() => removeRow(idx)}
                                                    title="Remove this record"
                                                >
                                                    <Icon name="remove" size={14} />
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

                </div>
    );
}
