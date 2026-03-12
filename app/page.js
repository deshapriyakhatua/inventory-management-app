"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend,
    PieChart, Pie, Cell
} from "recharts";

const CHART_COLORS = ["#38bdf8", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316"];

const NAV_CARDS = [
    {
        href: "/add-inventory",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
        ),
        label: "Add Inventory",
        desc: "Add a new inventory item",
        color: "#38bdf8",
    },
    {
        href: "/all-inventory",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ),
        label: "All Inventory",
        desc: "Browse all inventory items",
        color: "#10b981",
    },
    {
        href: "/add-listing",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        ),
        label: "Create Listing",
        desc: "Generate a marketplace listing",
        color: "#f59e0b",
    },
    {
        href: "/all-listings",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
        ),
        label: "All Listings",
        desc: "View and manage all listings",
        color: "#8b5cf6",
    },
    {
        href: "/add-sales-log",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ),
        label: "Log Sales",
        desc: "Record sales & returns",
        color: "#ec4899",
    },
    {
        href: "/sales-data",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        label: "Sales Analytics",
        desc: "Charts & insights on sales",
        color: "#f97316",
    },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className={styles.tooltip}>
                <p className={styles.tooltipLabel}>{label}</p>
                {payload.map((entry, idx) => (
                    <div key={idx} className={styles.tooltipItem}>
                        <span className={styles.tooltipDot} style={{ background: entry.color }} />
                        <span>{entry.name}: <strong>{entry.value}</strong></span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Raw data
    const [inventoryData, setInventoryData] = useState([]);
    const [listingsData, setListingsData] = useState([]);
    const [salesData, setSalesData] = useState([]);

    // UI
    const [salesRange, setSalesRange] = useState("30");

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const pin = sessionStorage.getItem("app_pin");

        // On initial load only: read from cache and return early if all 3 present
        if (!isRefresh) {
            const cachedInv = (() => {
                try { return JSON.parse(localStorage.getItem("all_inventory_data") || "null"); } catch { return null; }
            })();
            const cachedList = (() => {
                try { return JSON.parse(localStorage.getItem("all_listings_data") || "null"); } catch { return null; }
            })();
            const cachedSales = (() => {
                try { return JSON.parse(localStorage.getItem("all_sales_data") || "null"); } catch { return null; }
            })();

            if (cachedInv) setInventoryData(cachedInv);
            if (cachedList) setListingsData(Array.isArray(cachedList) ? cachedList : (cachedList.listings || []));
            if (cachedSales) setSalesData(cachedSales);

            if (cachedInv && cachedList && cachedSales) {
                setLoading(false);
                return;
            }
        }

        // Full fetch — always runs on manual refresh, runs on initial load only if cache is missing
        try {
            const fetchInv = fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ pin, action: "getInventory", page: 1, pageSize: 50000, sort: "newest_first" }),
            }).then(r => r.json()).then(res => {
                const items = res.status === 200 ? (res.data || []) : [];
                setInventoryData(items);
                localStorage.setItem("all_inventory_data", JSON.stringify(items));
            });

            const fetchList = fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ pin, action: "getListing", page: 1, pageSize: 50000, sort: "newest_first" }),
            }).then(r => r.json()).then(res => {
                const items = res.status === 200 ? (res.message?.listings || res.data || []) : [];
                setListingsData(items);
                localStorage.setItem("all_listings_data", JSON.stringify(items));
            });

            const fetchSales = fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ pin, action: "getFilteredSalesLog", startDate: "", endDate: new Date().toISOString().split("T")[0] }),
            }).then(r => r.json()).then(res => {
                const items = (res.status === 200 && Array.isArray(res.message)) ? res.message : [];
                setSalesData(items);
                localStorage.setItem("all_sales_data", JSON.stringify(items));
            });

            await Promise.all([fetchInv, fetchList, fetchSales]);
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ─── KPI Computations ───────────────────────────────────────────────────
    const cutoff = useMemo(() => {
        if (salesRange === "all") return null;
        const d = new Date();
        d.setDate(d.getDate() - parseInt(salesRange, 10));
        return d;
    }, [salesRange]);

    const filteredSales = useMemo(() =>
        salesData.filter(item => {
            if (!cutoff) return true;
            return new Date(item.date || item.createdAt) >= cutoff;
        }), [salesData, cutoff]);

    const totalSalesUnits = useMemo(() =>
        filteredSales.filter(i => i.type === "Sale").reduce((a, c) => a + Math.abs(Number(c.quantity) || 0), 0),
        [filteredSales]);

    const totalReturnsUnits = useMemo(() =>
        filteredSales.filter(i => i.type === "Return").reduce((a, c) => a + Math.abs(Number(c.quantity) || 0), 0),
        [filteredSales]);

    const netSales = totalSalesUnits - totalReturnsUnits;
    const returnRate = totalSalesUnits ? ((totalReturnsUnits / totalSalesUnits) * 100).toFixed(1) : "0.0";

    // ─── Chart: Sales Trend ──────────────────────────────────────────────────
    const trendData = useMemo(() => {
        const map = {};
        filteredSales.forEach(item => {
            const d = new Date(item.date || item.createdAt);
            if (isNaN(d)) return;
            const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            if (!map[key]) map[key] = { date: key, sales: 0, returns: 0, sortKey: d.toISOString() };
            const qty = Math.abs(Number(item.quantity) || 0);
            if (item.type === "Sale") map[key].sales += qty;
            else if (item.type === "Return") map[key].returns += qty;
        });
        return Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [filteredSales]);

    // ─── Chart: Platform Bar ─────────────────────────────────────────────────
    const platformData = useMemo(() => {
        const map = {};
        filteredSales.forEach(item => {
            const p = item.platform || "Other";
            if (!map[p]) map[p] = { name: p, sales: 0, returns: 0 };
            const qty = Math.abs(Number(item.quantity) || 0);
            if (item.type === "Sale") map[p].sales += qty;
            else if (item.type === "Return") map[p].returns += qty;
        });
        return Object.values(map).sort((a, b) => b.sales - a.sales);
    }, [filteredSales]);

    // ─── Chart: Vertical Pie ─────────────────────────────────────────────────
    const verticalData = useMemo(() => {
        const map = {};
        filteredSales.filter(i => i.type === "Sale").forEach(item => {
            const v = item.vertical || "Unknown";
            map[v] = (map[v] || 0) + Math.abs(Number(item.quantity) || 0);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredSales]);

    // ─── Inventory by Vertical ───────────────────────────────────────────────
    const inventoryByVertical = useMemo(() => {
        const map = {};
        inventoryData.forEach(item => {
            const v = item.vertical || item.verticalName || "Unknown";
            map[v] = (map[v] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [inventoryData]);

    // ─── Recent Sales Activity ────────────────────────────────────────────────
    const recentActivity = useMemo(() =>
        [...filteredSales]
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
            .slice(0, 8),
        [filteredSales]);

    // Totals for top KPI strip
    const totalInventory = inventoryData.length;
    const totalListings = listingsData.length;

    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Loading Dashboard…</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p className={styles.subtitle}>Welcome back! Here's your inventory & sales overview.</p>
                </div>
                <div className={styles.headerRight}>
                    <select
                        className={styles.rangeSelect}
                        value={salesRange}
                        onChange={e => setSalesRange(e.target.value)}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <button className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`} onClick={() => loadAllData(true)} disabled={refreshing} title="Refresh all data">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── KPI Strip ── */}
            <div className={styles.kpiStrip}>
                <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
                    <div className={styles.kpiIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiLabel}>Total Inventory</span>
                        <span className={styles.kpiValue}>{totalInventory.toLocaleString()}</span>
                        <span className={styles.kpiSub}>Items in stock</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
                    <div className={styles.kpiIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiLabel}>Total Listings</span>
                        <span className={styles.kpiValue}>{totalListings.toLocaleString()}</span>
                        <span className={styles.kpiSub}>Active marketplace SKUs</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.kpiGreen}`}>
                    <div className={styles.kpiIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                        </svg>
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiLabel}>Total Sales</span>
                        <span className={styles.kpiValue}>{totalSalesUnits.toLocaleString()}</span>
                        <span className={styles.kpiSub}>Units sold ({salesRange === "all" ? "all time" : `last ${salesRange}d`})</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.kpiCyan}`}>
                    <div className={styles.kpiIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiLabel}>Net Sales</span>
                        <span className={styles.kpiValue}>{netSales.toLocaleString()}</span>
                        <span className={styles.kpiSub}>After {totalReturnsUnits} returns</span>
                    </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.kpiAmber}`}>
                    <div className={styles.kpiIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3" />
                        </svg>
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiLabel}>Return Rate</span>
                        <span className={`${styles.kpiValue} ${Number(returnRate) >= 10 ? styles.kpiDanger : styles.kpiGood}`}>{returnRate}%</span>
                        <span className={styles.kpiSub}>{Number(returnRate) < 10 ? "Healthy" : "Needs attention"}</span>
                    </div>
                </div>
            </div>

            {/* ── Charts Row 1: Trend + Platform ── */}
            <div className={styles.chartsRow}>
                <div className={`${styles.chartCard} ${styles.chartWide}`}>
                    <h2 className={styles.chartTitle}>Sales &amp; Returns Trend</h2>
                    {trendData.length > 0 ? (
                        <div className={styles.chartArea}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradReturns" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="date" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} />
                                    <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px", paddingTop: "12px" }} />
                                    <Area type="monotone" dataKey="sales" name="Sales" stroke="#38bdf8" strokeWidth={2} fill="url(#gradSales)" />
                                    <Area type="monotone" dataKey="returns" name="Returns" stroke="#f43f5e" strokeWidth={2} fill="url(#gradReturns)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>No sales data for this period</div>
                    )}
                </div>

                <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>Platform Performance</h2>
                    {platformData.length > 0 ? (
                        <div className={styles.chartArea}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={platformData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                    <XAxis type="number" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} />
                                    <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} width={70} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px", paddingTop: "12px" }} />
                                    <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="returns" name="Returns" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>No platform data</div>
                    )}
                </div>
            </div>

            {/* ── Charts Row 2: Pie charts + Recent Activity ── */}
            <div className={styles.chartsRow2}>
                <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>Sales by Vertical</h2>
                    {verticalData.length > 0 ? (
                        <div className={styles.chartAreaPie}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={verticalData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {verticalData.map((_, idx) => (
                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>No vertical data</div>
                    )}
                </div>

                <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>Inventory by Vertical</h2>
                    {inventoryByVertical.length > 0 ? (
                        <div className={styles.chartAreaPie}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={inventoryByVertical} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {inventoryByVertical.map((_, idx) => (
                                            <Cell key={idx} fill={CHART_COLORS[(idx + 2) % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>No inventory data</div>
                    )}
                </div>

                {/* Recent Activity Feed */}
                <div className={styles.activityCard}>
                    <h2 className={styles.chartTitle}>Recent Activity</h2>
                    {recentActivity.length > 0 ? (
                        <div className={styles.activityList}>
                            {recentActivity.map((item, idx) => {
                                const isSale = item.type === "Sale";
                                const date = new Date(item.date || item.createdAt);
                                const dateStr = isNaN(date) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                                return (
                                    <div key={idx} className={styles.activityItem}>
                                        <span className={`${styles.activityDot} ${isSale ? styles.dotSale : styles.dotReturn}`} />
                                        <div className={styles.activityContent}>
                                            <span className={styles.activitySku}>{item.skuId || "—"}</span>
                                            <span className={styles.activityMeta}>
                                                {isSale ? "+" : "-"}{Math.abs(Number(item.quantity) || 0)} unit{Math.abs(Number(item.quantity) || 0) !== 1 ? "s" : ""} · {item.platform || "—"} · {dateStr}
                                            </span>
                                        </div>
                                        <span className={`${styles.activityBadge} ${isSale ? styles.badgeSale : styles.badgeReturn}`}>
                                            {item.type}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>No recent activity</div>
                    )}
                    {filteredSales.length > 8 && (
                        <Link href="/sales-records" className={styles.viewAllLink}>
                            View all {filteredSales.length} records →
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Quick Navigation Cards ── */}
            <div className={styles.navSection}>
                <h2 className={styles.sectionTitle}>Quick Navigation</h2>
                <div className={styles.navGrid}>
                    {NAV_CARDS.map(card => (
                        <Link key={card.href} href={card.href} className={styles.navCard} style={{ "--accent": card.color }}>
                            <div className={styles.navIcon} style={{ color: card.color, background: `${card.color}18` }}>
                                {card.icon}
                            </div>
                            <div className={styles.navText}>
                                <span className={styles.navLabel}>{card.label}</span>
                                <span className={styles.navDesc}>{card.desc}</span>
                            </div>
                            <svg className={styles.navArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
