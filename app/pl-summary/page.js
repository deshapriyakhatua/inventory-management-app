"use client";

import React, { useState, useCallback, useEffect } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

const MONTHS = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

const SALES_CHANNELS = ["Amazon", "Flipkart", "Shopsy", "Myntra", "Meesho", "Ajio", "Website", "Other"];

export default function PLSummaryPage() {
    const now = new Date();
    const [month, setMonth] = useState(String(now.getMonth() + 1));
    const [year, setYear] = useState(String(now.getFullYear()));
    const [salesChannel, setSalesChannel] = useState("Amazon");

    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });

    const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

    const formatCurrency = (val) => {
        if (val == null) return "—";
        return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getMonthLabel = (m) => MONTHS.find(x => x.value === String(m))?.label || m;

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setMessage({ text: "", type: "" });

        const params = new URLSearchParams({
            month,
            year,
            salesChannel,
        });

        try {
            const res = await fetch(`/api/employee/pl-summary?${params.toString()}`);
            const data = await res.json();

            if (res.ok && data.success) {
                setSummary(data);
            } else {
                setSummary(null);
                setMessage({ text: data.error || "Failed to load P&L summary.", type: "error" });
            }
        } catch {
            setSummary(null);
            setMessage({ text: "Network error loading P&L summary.", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [month, year, salesChannel]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>P&amp;L Summary</h1>
                    <p className={styles.subtitle}>
                        Monthly profit &amp; loss based on bank settlement and FIFO buying cost
                    </p>
                </div>
            </div>

            <div className={styles.filtersRow}>
                <select className={styles.filterSelect} value={month} onChange={e => setMonth(e.target.value)}>
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>

                <select className={styles.filterSelect} value={year} onChange={e => setYear(e.target.value)}>
                    {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <select className={styles.filterSelect} value={salesChannel} onChange={e => setSalesChannel(e.target.value)}>
                    {SALES_CHANNELS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <button className={styles.refreshBtn} onClick={fetchSummary} disabled={loading}>
                    {loading ? "Calculating…" : "Refresh"}
                </button>
            </div>

            {loading && !summary && (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Calculating P&amp;L…</p>
                </div>
            )}

            {summary && (
                <>
                    <div className={styles.periodBadge}>
                        {getMonthLabel(summary.filters.month)} {summary.filters.year} · {summary.filters.salesChannel}
                        {summary.skuCount > 0 && (
                            <span className={styles.periodMeta}>{summary.skuCount} SKU record{summary.skuCount !== 1 ? "s" : ""}</span>
                        )}
                    </div>

                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Total Sales</span>
                            <span className={`${styles.kpiValue} ${styles.positive}`}>{formatCurrency(summary.totalSales)}</span>
                            <span className={styles.kpiHint}>Sum of projected bank settlement</span>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Total Buying Price</span>
                            <span className={`${styles.kpiValue} ${styles.negative}`}>{formatCurrency(summary.totalBuyingPrice)}</span>
                            <span className={styles.kpiHint}>FIFO cost incl. customer returns</span>
                        </div>
                        <div className={styles.kpiCard}>
                            <span className={styles.kpiLabel}>Gross Profit</span>
                            <span className={`${styles.kpiValue} ${summary.grossProfit >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(summary.grossProfit)}
                            </span>
                            <span className={styles.kpiHint}>Sales minus buying price</span>
                        </div>
                    </div>

                    {summary.warnings?.length > 0 && (
                        <div className={styles.warningsBox}>
                            <strong>Notes</strong>
                            <ul>
                                {summary.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {summary.skuBreakdown?.length > 0 ? (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>SKU Breakdown</h2>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>SKU ID</th>
                                            <th>Channel</th>
                                            <th>Units Sold</th>
                                            <th>Net Units</th>
                                            <th>Cust. Returns</th>
                                            <th>Settlement (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.skuBreakdown.map((row, i) => (
                                            <tr key={`${row.skuId}-${i}`}>
                                                <td><span className={styles.skuText}>{row.skuId}</span></td>
                                                <td>{row.salesChannel || "—"}</td>
                                                <td>{row.unitsSold}</td>
                                                <td>{row.netUnits}</td>
                                                <td>{row.customerReturns}</td>
                                                <td className={styles.currencyCell}>{formatCurrency(row.projectedBankSettlement)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        !loading && (
                            <div className={styles.emptyState}>
                                No sales records found for the selected period and channel.
                            </div>
                        )
                    )}

                    {summary.inventoryBreakdown?.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Inventory COGS (FIFO)</h2>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Inventory ID</th>
                                            <th>Units This Month</th>
                                            <th>Prior Units Consumed</th>
                                            <th>Units Costed</th>
                                            <th>Buying Price (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.inventoryBreakdown.map((row) => (
                                            <tr key={row.inventoryId}>
                                                <td><span className={styles.skuText}>{row.inventoryId}</span></td>
                                                <td>{row.units}</td>
                                                <td>{row.priorUnits}</td>
                                                <td>{row.unitsCosted}</td>
                                                <td className={styles.currencyCell}>{formatCurrency(row.buyingPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            <Toast message={message} onClose={() => setMessage({ text: "", type: "" })} />
        </div>
    );
}
