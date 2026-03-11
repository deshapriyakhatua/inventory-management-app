"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Helper to get past dates YYYY-MM-DD
const getPastDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

export default function SalesDataPage() {
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState([]);
    
    // Filters State
    const [dateRange, setDateRange] = useState("30"); // days
    const [selectedVertical, setSelectedVertical] = useState("All");
    const [selectedPlatform, setSelectedPlatform] = useState("All");
    const [message, setMessage] = useState({ text: "", type: "" });

    // Use effect to fetch data anytime filters change
    useEffect(() => {
        fetchSalesData();
    }, [dateRange, selectedVertical, selectedPlatform]);

    const fetchSalesData = async () => {
        setLoading(true);
        setMessage({ text: "", type: "" });
        const pin = sessionStorage.getItem("app_pin");
        
        let startDateStr = "";
        let endDateStr = new Date().toISOString().split('T')[0];
        
        if (dateRange !== "all") {
            startDateStr = getPastDateStr(parseInt(dateRange, 10));
        }

        const payload = {
            pin,
            action: "getFilteredSalesLog",
            startDate: startDateStr,
            endDate: endDateStr
        };

        if (selectedVertical !== "All") payload.vertical = selectedVertical;
        if (selectedPlatform !== "All") payload.platform = selectedPlatform;
        // Optionally pass type, but we want both Sales & Returns to plot them against each other
console.log(payload)
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(res => res.json());

            if (response.status === 200 && Array.isArray(response.message)) {
                // The quantity for returns might come back as negative (like -1), so ensure we use Math.abs everywhere we aggregate units.
                setRawData(response.message);
                console.log(response.message)
            } else {
                setMessage({ text: response.message || "Failed to load data.", type: "error" });
                setRawData([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setMessage({ text: "Network error while loading data.", type: "error" });
            setRawData([]);
        } finally {
            setLoading(false);
        }
    };

    // --- DATA AGGREGATION ---
    // Note: The API does the filtering for us now. We just aggregate what we get.
    
    // 1. Aggregate Time Series Data
    const timeMap = {};
    rawData.forEach(item => {
        if (!item.date) return;
        
        // Format date for display
        const d = new Date(item.date);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!timeMap[dateStr]) {
            timeMap[dateStr] = { date: dateStr, sales: 0, returns: 0, sortKey: item.date };
        }
        
        const qty = Math.abs(Number(item.quantity) || 0); // Convert negs to pos for counting units
        
        if (item.type === 'Sale') timeMap[dateStr].sales += qty;
        else if (item.type === 'Return') timeMap[dateStr].returns += qty;
    });
    
    // Convert to array and sort chronologically
    const timeData = Object.values(timeMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // 2. Aggregate Vertical Data
    const verticalMap = {};
    rawData.forEach(item => {
        if (item.type === 'Sale') {
            const v = item.vertical || "Unknown";
            const qty = Math.abs(Number(item.quantity) || 0);
            verticalMap[v] = (verticalMap[v] || 0) + qty;
        }
    });
    const verticalsData = Object.keys(verticalMap).map(key => ({ name: key, value: verticalMap[key] }));

    // 3. Aggregate Platform Data
    const platformMap = {};
    rawData.forEach(item => {
        const p = item.platform || "Unknown";
        if (!platformMap[p]) {
            platformMap[p] = { name: p, sales: 0, returns: 0 };
        }
        
        const qty = Math.abs(Number(item.quantity) || 0);
        if (item.type === 'Sale') platformMap[p].sales += qty;
        else if (item.type === 'Return') platformMap[p].returns += qty;
    });
    const platformData = Object.values(platformMap);

    // Derived KPIs
    const totalSales = rawData.filter(i => i.type === 'Sale').reduce((acc, curr) => acc + Math.abs(Number(curr.quantity) || 0), 0);
    const totalReturns = rawData.filter(i => i.type === 'Return').reduce((acc, curr) => acc + Math.abs(Number(curr.quantity) || 0), 0);
    const netSales = totalSales - totalReturns;
    const returnRate = totalSales ? ((totalReturns / totalSales) * 100).toFixed(1) : 0;


    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className={styles.tooltipItem}>
                            <div className={styles.tooltipColor} style={{ backgroundColor: entry.color }}></div>
                            <span>{entry.name}: {entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading Sales Data...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sales Overview</h1>
                
                <div className={styles.filtersRow}>
                    <select 
                        className={styles.filterDate}
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>

                    <select 
                        className={styles.filterSelect}
                        value={selectedVertical}
                        onChange={(e) => setSelectedVertical(e.target.value)}
                    >
                        <option value="All">All Verticals</option>
                        <option value="ER">ER</option>
                        <option value="NW">NW</option>
                        <option value="PT">PT</option>
                    </select>

                    <select 
                        className={styles.filterSelect}
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                    >
                        <option value="All">All Platforms</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Flipkart">Flipkart</option>
                        <option value="Meesho">Meesho</option>
                        <option value="JioMart">JioMart</option>
                        <option value="Myntra">Myntra</option>
                        <option value="Own Site">Own Site</option>
                    </select>
                </div>
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiTitle}>Total Sales (Units)</span>
                    <span className={styles.kpiValue}>{totalSales.toLocaleString()}</span>
                    <span className={`${styles.kpiChange} ${styles.positive}`}>
                        Based on filtered period
                    </span>
                </div>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiTitle}>Net Sales (Units)</span>
                    <span className={styles.kpiValue}>{netSales.toLocaleString()}</span>
                    <span className={`${styles.kpiChange} ${styles.positive}`}>
                        Total Sales - Returns
                    </span>
                </div>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiTitle}>Total Returns (Units)</span>
                    <span className={styles.kpiValue}>{totalReturns.toLocaleString()}</span>
                    <span className={`${styles.kpiChange} ${styles.negative}`}>
                        Items returned
                    </span>
                </div>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiTitle}>Return Rate</span>
                    <span className={styles.kpiValue}>{returnRate}%</span>
                    <span className={`${styles.kpiChange} ${returnRate < 10 ? styles.positive : styles.negative}`}>
                        {returnRate < 10 ? 'Healthy metric' : 'Needs attention'}
                    </span>
                </div>
            </div>

            <div className={styles.chartsGrid}>
                <div className={`${styles.chartCard} ${styles.fullWidth}`}>
                    <h2 className={styles.chartHeader}>Sales & Returns Trend</h2>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="sales" name="Sales (Units)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="returns" name="Returns (Units)" stroke="#ef4444" fillOpacity={1} fill="url(#colorReturns)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h2 className={styles.chartHeader}>Platform Performance</h2>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={platformData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="returns" name="Returns" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h2 className={styles.chartHeader}>Total Sales by Vertical</h2>
                    <div className={styles.pieChartWrapper}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={verticalsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {verticalsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <Toast 
                message={message} 
                onClose={() => setMessage({ text: "", type: "" })} 
            />
        </div>
    );
}
