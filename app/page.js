"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend,
    PieChart, Pie, Cell
} from "recharts";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import { useChartColors } from "@/components/ui/chartTheme";
import ChartCard from "./_components/ChartCard/ChartCard";
import ChartTooltip from "./_components/ChartTooltip/ChartTooltip";
import NavCardGrid from "./_components/NavCardGrid/NavCardGrid";
import RecentActivity from "./_components/RecentActivity/RecentActivity";
import StatCard from "./_components/StatCard/StatCard";
import styles from "./page.module.css";

const RANGE_OPTIONS = [
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last 90 Days" },
    { value: "all", label: "All Time" },
];

const NAV_CARDS = [
    {
        href: "/add-inventory",
        icon: "add-inventory",
        label: "Add Inventory",
        desc: "Add a new inventory item",
        tone: 1,
    },
    {
        href: "/all-inventory",
        icon: "all-inventory",
        label: "All Inventory",
        desc: "Browse all inventory items",
        tone: 2,
    },
    {
        href: "/add-listing",
        icon: "add-another-product",
        label: "Create Listing",
        desc: "Generate a marketplace listing",
        tone: 4,
    },
    {
        href: "/all-listings",
        icon: "icon-5d77ebc6",
        label: "All Listings",
        desc: "View and manage all listings",
        tone: 5,
    },
    {
        href: "/add-sales-log",
        icon: "log-sales",
        label: "Log Sales",
        desc: "Record sales & returns",
        tone: 3,
    },
    {
        href: "/sales-data",
        icon: "sales-data",
        label: "Sales Data",
        desc: "Browse monthly sales records",
        tone: 6,
    },
];

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Raw data
    const [inventoryData, setInventoryData] = useState([]);
    const [listingsData, setListingsData] = useState([]);
    const [salesData, setSalesData] = useState([]);

    // UI
    const [salesRange, setSalesRange] = useState("30");
    const chart = useChartColors();
    const tick = { fill: chart.axisText, fontSize: 12 };
    const legendStyle = { color: chart.axisText, fontSize: "13px" };

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const fetchInv = fetch("/api/employee/inventory")
                .then(r => r.json())
                .then(res => {
                    const items = Array.isArray(res?.data) ? res.data : [];
                    setInventoryData(items);
                })
                .catch(e => {
                    console.error("Dashboard fetch inventory error:", e);
                    setInventoryData([]);
                });

            const fetchList = fetch("/api/employee/listing")
                .then(r => r.json())
                .then(res => {
                    const items = Array.isArray(res?.data) ? res.data : [];
                    setListingsData(items);
                })
                .catch(e => {
                    console.error("Dashboard fetch listings error:", e);
                    setListingsData([]);
                });

            const fetchSales = fetch("/api/employee/sales-records?pageSize=5000")
                .then(r => r.json())
                .then(res => {
                    const items = Array.isArray(res?.records)
                        ? res.records
                        : (Array.isArray(res?.data) ? res.data : []);
                    setSalesData(items);
                })
                .catch(e => {
                    console.error("Dashboard fetch sales error:", e);
                    setSalesData([]);
                });

            await Promise.all([fetchInv, fetchList, fetchSales]);
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Safe data arrays
    const safeInventoryData = Array.isArray(inventoryData) ? inventoryData : [];
    const safeListingsData = Array.isArray(listingsData) ? listingsData : [];
    const safeSalesData = Array.isArray(salesData) ? salesData : [];

    // Map skuId to vertical from listings
    const skuVerticalMap = useMemo(() => {
        const map = {};
        safeListingsData.forEach(l => {
            if (l.skuId && l.vertical) map[l.skuId] = l.vertical;
        });
        return map;
    }, [safeListingsData]);

    // ─── KPI Computations ───────────────────────────────────────────────────
    const cutoff = useMemo(() => {
        if (salesRange === "all") return null;
        const d = new Date();
        d.setDate(d.getDate() - parseInt(salesRange, 10));
        return d;
    }, [salesRange]);

    const filteredSales = useMemo(() =>
        safeSalesData.filter(item => {
            if (!item) return false;
            if (!cutoff) return true;
            const itemDate = item.createdAt
                ? new Date(item.createdAt)
                : (item.year && item.month ? new Date(item.year, item.month - 1, 15) : new Date(item.date || 0));
            return itemDate >= cutoff;
        }), [safeSalesData, cutoff]);

    const { totalSalesUnits, totalReturnsUnits, netSalesAmount } = useMemo(() => {
        let sales = 0;
        let returns = 0;
        let amount = 0;
        filteredSales.forEach(i => {
            if (!i) return;
            if (i.grossUnits != null || i.netUnits != null) {
                const sUnits = Number(i.grossUnits) || 0;
                const rUnits = (Number(i.logisticsReturns) || 0) + (Number(i.customerReturns) || 0);
                sales += sUnits;
                returns += rUnits;
                amount += Number(i.netSales) || 0;
            } else {
                const qty = Math.abs(Number(i.quantity) || 0);
                if (i.type === "Sale") sales += qty;
                else if (i.type === "Return") returns += qty;
            }
        });
        return { totalSalesUnits: sales, totalReturnsUnits: returns, netSalesAmount: amount };
    }, [filteredSales]);

    const netSales = netSalesAmount || (totalSalesUnits - totalReturnsUnits);
    const returnRate = totalSalesUnits ? (((totalReturnsUnits || 0) / totalSalesUnits) * 100).toFixed(1) : "0.0";

    // ─── Chart: Sales Trend ──────────────────────────────────────────────────
    const trendData = useMemo(() => {
        const map = {};
        filteredSales.forEach(item => {
            if (!item) return;
            const d = item.createdAt
                ? new Date(item.createdAt)
                : (item.year && item.month ? new Date(item.year, item.month - 1, 15) : new Date(item.date));
            if (isNaN(d.getTime())) return;
            const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            if (!map[key]) map[key] = { date: key, sales: 0, returns: 0, sortKey: d.toISOString() };
            if (item.grossUnits != null || item.netUnits != null) {
                map[key].sales += Number(item.grossUnits) || 0;
                map[key].returns += (Number(item.logisticsReturns) || 0) + (Number(item.customerReturns) || 0);
            } else {
                const qty = Math.abs(Number(item.quantity) || 0);
                if (item.type === "Sale") map[key].sales += qty;
                else if (item.type === "Return") map[key].returns += qty;
            }
        });
        return Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [filteredSales]);

    // ─── Chart: Platform Bar ─────────────────────────────────────────────────
    const platformData = useMemo(() => {
        const map = {};
        filteredSales.forEach(item => {
            if (!item) return;
            const p = item.salesChannel || item.platform || "Other";
            if (!map[p]) map[p] = { name: p, sales: 0, returns: 0 };
            if (item.grossUnits != null || item.netUnits != null) {
                map[p].sales += Number(item.grossUnits) || 0;
                map[p].returns += (Number(item.logisticsReturns) || 0) + (Number(item.customerReturns) || 0);
            } else {
                const qty = Math.abs(Number(item.quantity) || 0);
                if (item.type === "Sale") map[p].sales += qty;
                else if (item.type === "Return") map[p].returns += qty;
            }
        });
        return Object.values(map).sort((a, b) => b.sales - a.sales);
    }, [filteredSales]);

    // ─── Chart: Vertical Pie ─────────────────────────────────────────────────
    const verticalData = useMemo(() => {
        const map = {};
        filteredSales.forEach(item => {
            if (!item) return;
            const v = item.vertical || skuVerticalMap[item.skuId] || "Unknown";
            const qty = item.grossUnits != null ? (Number(item.grossUnits) || 0) : (item.type === "Sale" ? Math.abs(Number(item.quantity) || 0) : 0);
            if (qty > 0) {
                map[v] = (map[v] || 0) + qty;
            }
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredSales, skuVerticalMap]);

    // ─── Inventory by Vertical ───────────────────────────────────────────────
    const inventoryByVertical = useMemo(() => {
        const map = {};
        safeInventoryData.forEach(item => {
            if (!item) return;
            const v = item.vertical || item.verticalName || "Unknown";
            map[v] = (map[v] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [safeInventoryData]);

    // ─── Recent Sales Activity ────────────────────────────────────────────────
    const recentActivity = useMemo(() =>
        [...filteredSales]
            .sort((a, b) => {
                const dA = a.createdAt ? new Date(a.createdAt) : new Date(a.year || 0, (a.month || 1) - 1, 15);
                const dB = b.createdAt ? new Date(b.createdAt) : new Date(b.year || 0, (b.month || 1) - 1, 15);
                return dB - dA;
            })
            .slice(0, 8),
        [filteredSales]);

    // Totals for top KPI strip
    const totalInventory = safeInventoryData.length;
    const totalListings = safeListingsData.length;

    const stats = [
        { icon: "icon-d0275ba0", tone: 1, label: "Total Inventory", value: (totalInventory ?? 0).toLocaleString(), sub: "Items in stock" },
        { icon: "icon-5d77ebc6", tone: 5, label: "Total Listings", value: (totalListings ?? 0).toLocaleString(), sub: "Active marketplace SKUs" },
        { icon: "icon-a312377a", tone: 2, label: "Total Sales", value: (totalSalesUnits ?? 0).toLocaleString(), sub: `Units sold (${salesRange === "all" ? "all time" : `last ${salesRange}d`})` },
        { icon: "sales-data", tone: 6, label: "Net Sales", value: (netSales ?? 0).toLocaleString(), sub: `After ${totalReturnsUnits} returns` },
        {
            icon: "icon-d347fd9b", tone: 4, label: "Return Rate", value: `${returnRate}%`,
            valueTone: Number(returnRate) >= 10 ? "danger" : "success",
            sub: Number(returnRate) < 10 ? "Healthy" : "Needs attention",
        },
    ];

    return (
        <PageShell>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome back! Here's your inventory & sales overview."
                actions={
                    <>
                        <SegmentedControl
                            aria-label="Sales range"
                            options={RANGE_OPTIONS}
                            value={salesRange}
                            onValueChange={setSalesRange}
                        />
                        <Button
                            variant="secondary"
                            leftIcon={<Icon name="refresh" size={16} />}
                            loading={refreshing}
                            disabled={loading}
                            onClick={() => loadAllData(true)}
                            title="Refresh all data"
                        >
                            Refresh
                        </Button>
                    </>
                }
            />

            {loading ? (
                <div className={styles.loading} aria-busy="true" aria-label="Loading Dashboard…">
                    <div className={styles.statGrid}>
                        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className={styles.skeletonStat} />)}
                    </div>
                    <div className={styles.chartsRow}>
                        <Skeleton className={styles.skeletonChart} />
                        <Skeleton className={styles.skeletonChart} />
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.statGrid}>
                        {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
                    </div>

                    <div className={styles.chartsRow}>
                        <ChartCard title="Sales & Returns Trend" empty={trendData.length === 0} emptyText="No sales data for this period">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chart.series[0]} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={chart.series[0]} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradReturns" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chart.series[2]} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={chart.series[2]} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                                    <XAxis dataKey="date" stroke={chart.axis} tick={tick} tickLine={false} />
                                    <YAxis stroke={chart.axis} tick={tick} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ ...legendStyle, paddingTop: "12px" }} />
                                    <Area type="monotone" dataKey="sales" name="Sales" stroke={chart.series[0]} strokeWidth={2} fill="url(#gradSales)" />
                                    <Area type="monotone" dataKey="returns" name="Returns" stroke={chart.series[2]} strokeWidth={2} fill="url(#gradReturns)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Platform Performance" empty={platformData.length === 0} emptyText="No platform data">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={platformData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                                    <XAxis type="number" stroke={chart.axis} tick={tick} tickLine={false} />
                                    <YAxis dataKey="name" type="category" stroke={chart.axis} tick={tick} tickLine={false} axisLine={false} width={70} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ ...legendStyle, paddingTop: "12px" }} />
                                    <Bar dataKey="sales" name="Sales" fill={chart.series[1]} radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="returns" name="Returns" fill={chart.series[2]} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div className={styles.chartsRow2}>
                        <ChartCard title="Sales by Vertical" size="pie" empty={verticalData.length === 0} emptyText="No vertical data">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={verticalData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {verticalData.map((_, idx) => (
                                            <Cell key={idx} fill={chart.series[idx % chart.series.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={legendStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Inventory by Vertical" size="pie" empty={inventoryByVertical.length === 0} emptyText="No inventory data">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={inventoryByVertical} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {inventoryByVertical.map((_, idx) => (
                                            <Cell key={idx} fill={chart.series[(idx + 2) % chart.series.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={legendStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <RecentActivity items={recentActivity} totalCount={filteredSales.length} />
                    </div>

                    <NavCardGrid title="Quick Navigation" cards={NAV_CARDS} />
                </>
            )}
        </PageShell>
    );
}
