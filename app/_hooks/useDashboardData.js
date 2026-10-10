import { useState, useEffect, useMemo } from "react";

export function useDashboardData() {
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
    const safeInventoryData = useMemo(() => (Array.isArray(inventoryData) ? inventoryData : []), [inventoryData]);
    const safeListingsData = useMemo(() => (Array.isArray(listingsData) ? listingsData : []), [listingsData]);
    const safeSalesData = useMemo(() => (Array.isArray(salesData) ? salesData : []), [salesData]);

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

    return {
        loading, refreshing, salesRange, setSalesRange, loadAllData,
        totalSalesUnits, totalReturnsUnits, netSales, returnRate,
        trendData, platformData, verticalData, inventoryByVertical,
        recentActivity, filteredSales, totalInventory, totalListings,
    };
}
