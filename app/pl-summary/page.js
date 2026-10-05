"use client";
import { toast } from "sonner";


import React, { useState, useCallback, useEffect } from "react";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Select from "@/components/ui/Select/Select";
import Spinner from "@/components/ui/Spinner/Spinner";
import Table from "@/components/ui/Table/Table";
import styles from "./page.module.css";


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


    const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

    const formatCurrency = (val) => {
        if (val == null || isNaN(Number(val))) return "—";
        return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getMonthLabel = (m) => MONTHS.find(x => x.value === String(m))?.label || m;

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        toast.dismiss("app-feedback");

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
                toast.error(data.error || "Failed to load P&L summary.", { id: "app-feedback", duration: 3000 });
            }
        } catch {
            setSummary(null);
            toast.error("Network error loading P&L summary.", { id: "app-feedback", duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [month, year, salesChannel]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return (
        <PageShell>
            <PageHeader
                title="P&L Summary"
                subtitle="Monthly profit & loss based on bank settlement and FIFO buying cost"
            />

            <Card className={styles.filters}>
                <Select aria-label="Month" value={month} onChange={e => setMonth(e.target.value)}>
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </Select>

                <Select aria-label="Year" value={year} onChange={e => setYear(e.target.value)}>
                    {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </Select>

                <Select aria-label="Sales channel" value={salesChannel} onChange={e => setSalesChannel(e.target.value)}>
                    {SALES_CHANNELS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </Select>

                <Button onClick={fetchSummary} loading={loading}>
                    {loading ? "Calculating…" : "Refresh"}
                </Button>
            </Card>

            {loading && !summary && (
                <div className={styles.loading}>
                    <Spinner size="lg" label="Calculating P&L" />
                    <p>Calculating P&amp;L…</p>
                </div>
            )}

            {summary && (
                <>
                    <div className={styles.period}>
                        {getMonthLabel(summary.filters.month)} {summary.filters.year} · {summary.filters.salesChannel}
                        {summary.skuCount > 0 && (
                            <span className={styles.periodMeta}>{summary.skuCount} SKU record{summary.skuCount !== 1 ? "s" : ""}</span>
                        )}
                    </div>

                    <div className={styles.kpiGrid}>
                        <Card className={styles.kpi}>
                            <span className={styles.kpiLabel}>Total Sales</span>
                            <span className={`${styles.kpiValue} ${styles.positive}`}>{formatCurrency(summary.totalSales)}</span>
                            <span className={styles.kpiHint}>Sum of projected bank settlement</span>
                        </Card>
                        <Card className={styles.kpi}>
                            <span className={styles.kpiLabel}>Total Buying Price</span>
                            <span className={`${styles.kpiValue} ${styles.negative}`}>{formatCurrency(summary.totalBuyingPrice)}</span>
                            <span className={styles.kpiHint}>FIFO cost incl. customer returns</span>
                        </Card>
                        <Card className={styles.kpi}>
                            <span className={styles.kpiLabel}>Gross Profit</span>
                            <span className={`${styles.kpiValue} ${summary.grossProfit >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(summary.grossProfit)}
                            </span>
                            <span className={styles.kpiHint}>Sales minus buying price</span>
                        </Card>
                    </div>

                    {summary.warnings?.length > 0 && (
                        <div className={styles.warnings}>
                            <strong>Notes</strong>
                            <ul>
                                {summary.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {summary.skuBreakdown?.length > 0 ? (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>SKU Breakdown</h2>
                            <Table columns={6}>
                                <Table.Head>
                                    <Table.Row hover={false}>
                                        <Table.Cell as="th">SKU ID</Table.Cell>
                                        <Table.Cell as="th">Channel</Table.Cell>
                                        <Table.Cell as="th" numeric>Units Sold</Table.Cell>
                                        <Table.Cell as="th" numeric>Net Units</Table.Cell>
                                        <Table.Cell as="th" numeric>Cust. Returns</Table.Cell>
                                        <Table.Cell as="th" numeric>Settlement (₹)</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {summary.skuBreakdown.map((row, i) => (
                                        <Table.Row key={`${row.skuId}-${i}`}>
                                            <Table.Cell><Badge tone="accent">{row.skuId}</Badge></Table.Cell>
                                            <Table.Cell>{row.salesChannel || "—"}</Table.Cell>
                                            <Table.Cell numeric>{row.unitsSold}</Table.Cell>
                                            <Table.Cell numeric>{row.netUnits}</Table.Cell>
                                            <Table.Cell numeric>{row.customerReturns}</Table.Cell>
                                            <Table.Cell numeric className={styles.currency}>{formatCurrency(row.projectedBankSettlement)}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </section>
                    ) : (
                        !loading && (
                            <EmptyState title="No sales records found for the selected period and channel." />
                        )
                    )}

                    {summary.inventoryBreakdown?.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Inventory COGS (FIFO)</h2>
                            <Table columns={5}>
                                <Table.Head>
                                    <Table.Row hover={false}>
                                        <Table.Cell as="th">Inventory ID</Table.Cell>
                                        <Table.Cell as="th" numeric>Units This Month</Table.Cell>
                                        <Table.Cell as="th" numeric>Prior Units Consumed</Table.Cell>
                                        <Table.Cell as="th" numeric>Units Costed</Table.Cell>
                                        <Table.Cell as="th" numeric>Buying Price (₹)</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {summary.inventoryBreakdown.map((row) => (
                                        <Table.Row key={row.inventoryId}>
                                            <Table.Cell><Badge tone="accent">{row.inventoryId}</Badge></Table.Cell>
                                            <Table.Cell numeric>{row.units}</Table.Cell>
                                            <Table.Cell numeric>{row.priorUnits}</Table.Cell>
                                            <Table.Cell numeric>{row.unitsCosted}</Table.Cell>
                                            <Table.Cell numeric className={styles.currency}>{formatCurrency(row.buyingPrice)}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </section>
                    )}
                </>
            )}
        </PageShell>
    );
}
