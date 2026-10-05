"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState, useRef } from "react";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import FormField from "@/components/ui/FormField/FormField";
import IconButton from "@/components/ui/IconButton/IconButton";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Select from "@/components/ui/Select/Select";
import Spinner from "@/components/ui/Spinner/Spinner";
import Table from "@/components/ui/Table/Table";
import cx from "@/components/ui/cx";
import styles from "./page.module.css";

import { parseCSV } from "../../utils/csvParser";

const STATUS_TONES = {
    ordered: "info",
    dispatched: "success",
    cancelled: "danger",
    logistics_return: "warning",
    returned: "warning",
};

export default function UploadSalesLog() {
    const [marketplace, setMarketplace] = useState("Flipkart");
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [fileError, setFileError] = useState("");

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
            setFileError("Please select a valid CSV file.");
            toast.error("Please select a valid CSV file.", { id: "app-feedback", duration: 3000 });
            return;
        }

        setFileError("");
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
            setFileError("Failed to parse CSV file.");
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
        setFileError("");
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
            setFileError("No data to submit.");
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
            setFileError("No valid sales items found in the file.");
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

    const allDispatched = parsedData.length > 0 && parsedData.every(item => item.status === 'DISPATCHED');
    const allDispatchedTitle = parsedData.every(item => item.status === 'DISPATCHED') ? "Revert all to original status" : "Mark all as Dispatched";

    return (
        <PageShell className={styles.shell}>
            <PageHeader title="Bulk Sales Upload" />

            <Card padding="lg" className={styles.card}>
                <FormField label="Select Marketplace">
                    <Select
                        value={marketplace}
                        onChange={(e) => setMarketplace(e.target.value)}
                    >
                        <option value="Flipkart">Flipkart</option>
                        {/* More marketplaces can be added here */}
                    </Select>
                </FormField>

                <div className={styles.dropField}>
                    <label
                        className={cx(styles.dropzone, isDragging && styles.isDragging, fileError && styles.isInvalid)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="srOnly"
                            accept=".csv"
                            onChange={handleFileSelect}
                            aria-invalid={fileError ? true : undefined}
                            aria-describedby={fileError ? "salesFile-error" : undefined}
                        />

                        <span className={styles.dropIcon}>
                            <Icon name="icon-f583f931" size={48} />
                        </span>

                        <span className={styles.dropText}>
                            {isParsing && <Spinner size="sm" label="Parsing file..." />}
                            {isParsing ? "Parsing file..." : "Click to upload or drag & drop CSV file"}
                        </span>
                        <span className={styles.dropHint}>
                            Supports Flipkart Sales Report Format
                        </span>
                    </label>
                    {fileError && (
                        <span id="salesFile-error" className={styles.error} role="alert">{fileError}</span>
                    )}
                </div>

                {file && (
                    <div className={styles.fileInfo}>
                        <Icon name="pdf-preview" size={18} />
                        <span className={styles.fileName}>
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        {isParsing ? (
                            <Badge tone="info" className={styles.statusBadge}>
                                <Spinner size="sm" label="Parsing file..." className={styles.badgeSpinner} />
                                Parsing file...
                            </Badge>
                        ) : isSubmitting ? (
                            <Badge tone="info" className={styles.statusBadge}>
                                <Spinner size="sm" label="Uploading..." className={styles.badgeSpinner} />
                                Uploading...
                            </Badge>
                        ) : parsedData.length > 0 && (
                            <Badge tone="success">{parsedData.length} records found</Badge>
                        )}
                        <IconButton
                            name="remove-this-product"
                            size="sm"
                            className={styles.removeFile}
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            title="Remove file"
                            aria-label="Remove file"
                        />
                    </div>
                )}

                <div className={styles.actions}>
                    <Button
                        size="lg"
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={isSubmitting || isParsing}
                        leftIcon={isSubmitting ? <Spinner size="sm" label="Uploading..." className={styles.buttonSpinner} /> : undefined}
                    >
                        {isSubmitting ? "Uploading..." : `Submit ${parsedData.length > 0 ? parsedData.length : ""} Records`}
                    </Button>
                </div>
            </Card>

            {parsedData.length > 0 && (
                <Card padding="md" className={styles.preview}>
                    <div className={styles.previewHeader}>
                        <h2 className={styles.previewTitle}>Data Preview</h2>
                        <span className={styles.previewCount}>{parsedData.length} records found</span>
                    </div>
                    <Table maxHeight="25rem" columns={8}>
                        <Table.Head>
                            <tr>
                                <Table.Cell as="th" className={styles.stickyColumn}>
                                    <Checkbox
                                        checked={allDispatched}
                                        onChange={(e) => toggleAllRows(e.target.checked)}
                                        title={allDispatchedTitle}
                                        aria-label={allDispatchedTitle}
                                    />
                                </Table.Cell>
                                <Table.Cell as="th">Order Date</Table.Cell>
                                <Table.Cell as="th">Order ID</Table.Cell>
                                <Table.Cell as="th">Line ID</Table.Cell>
                                <Table.Cell as="th">SKU</Table.Cell>
                                <Table.Cell as="th" numeric>Quantity</Table.Cell>
                                <Table.Cell as="th">Status</Table.Cell>
                                <Table.Cell as="th" className={styles.actionColumn}></Table.Cell>
                            </tr>
                        </Table.Head>
                        <Table.Body>
                            {parsedData.map((item, idx) => {
                                const rowTitle = item.status === 'DISPATCHED' ? "Revert to original status" : "Mark as Dispatched";
                                return (
                                    <Table.Row key={idx}>
                                        <Table.Cell className={styles.stickyColumn}>
                                            <Checkbox
                                                checked={item.status === 'DISPATCHED'}
                                                onChange={() => toggleRowStatus(idx)}
                                                title={rowTitle}
                                                aria-label={rowTitle}
                                            />
                                        </Table.Cell>
                                        <Table.Cell className={styles.cellText}>{item.orderedOn}</Table.Cell>
                                        <Table.Cell className={styles.cellText}>{item.orderId}</Table.Cell>
                                        <Table.Cell className={styles.cellText}>{item.orderItemId}</Table.Cell>
                                        <Table.Cell className={styles.cellText}>{item.sku}</Table.Cell>
                                        <Table.Cell numeric>{item.quantity}</Table.Cell>
                                        <Table.Cell>
                                            <Badge tone={STATUS_TONES[item.status?.toLowerCase() || 'ordered'] || "neutral"} className={styles.statusText}>
                                                {item.status || 'NA'}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <IconButton
                                                name="remove"
                                                size="sm"
                                                className={styles.removeRow}
                                                onClick={() => removeRow(idx)}
                                                title="Remove this record"
                                                aria-label="Remove this record"
                                            />
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table>
                </Card>
            )}
        </PageShell>
    );
}
