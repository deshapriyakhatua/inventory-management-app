"use client";

import React from "react";
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
import { useDashboardData } from "@/app/_hooks/useDashboardData";
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
    const {
        loading, refreshing, salesRange, setSalesRange, loadAllData,
        totalSalesUnits, totalReturnsUnits, netSales, returnRate,
        trendData, platformData, verticalData, inventoryByVertical,
        recentActivity, filteredSales, totalInventory, totalListings,
    } = useDashboardData();

    const chart = useChartColors();
    const tick = { fill: chart.axisText, fontSize: 12 };
    const legendStyle = { color: chart.axisText, fontSize: "13px" };

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
