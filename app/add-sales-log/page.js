"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { fetchVerticalsData } from "../../utils/apiUtils";

// ─── Helpers ────────────────────────────────────────────────────────────────
let _orderCounter = 0;
const newOrderId = () => `order_${++_orderCounter}_${Date.now()}`;

const emptyOrder = () => ({
    id: newOrderId(),
    skuId: "",
    quantity: 1,
    orderId: "",
    lineId: "",
    orderDate: "",
    dispatchDate: "",
    orderToday: false,
    dispatchToday: false,
    // picker state (per order)
    pickerOpen: false,
    pickerSearch: "",
    pickerVertical: "",
    pickerMarketplace: "",
    pickerPage: 1,
});

const localDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PAGE_SIZE = 8;

// ─── Component ──────────────────────────────────────────────────────────────
export default function AddSalesLog() {
    const [listings, setListings] = useState([]);
    const [verticals, setVerticals] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // orders: array of order objects, starts with one empty order
    const [orders, setOrders] = useState([emptyOrder()]);

    // ── Data Loading ──────────────────────────────────────────────────────
    useEffect(() => { loadInitialData(); }, []);

    const loadInitialData = async () => {
        setLoadingData(true);
        const pin = sessionStorage.getItem("app_pin");
        try {
            const cachedVerticals = await fetchVerticalsData(pin);
            setVerticals(cachedVerticals || []);

            const cachedListings = localStorage.getItem("all_listings_data");
            if (cachedListings) {
                try { setListings(JSON.parse(cachedListings)); setLoadingData(false); return; }
                catch (e) { console.error("Failed to parse cached listings", e); }
            }
            await fetchListingsData(false);
        } catch (error) {
            setMessage({ text: "Failed to load initial data.", type: "error" });
            setLoadingData(false);
        }
    };

    const fetchListingsData = async (forceRefresh = false) => {
        const pin = sessionStorage.getItem("app_pin");
        if (forceRefresh) setRefreshing(true); else setLoadingData(true);
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ pin, action: "getListing", page: 1, pageSize: 50000, sort: "newest_first" })
            }).then(r => r.json());

            if (res.status === 200) {
                let data = [];
                if (res.data && Array.isArray(res.data.listings)) {
                    data = res.data.listings;
                } else if (res.message && Array.isArray(res.message.listings)) {
                    data = res.message.listings;
                } else if (Array.isArray(res.data)) {
                    data = res.data;
                } else if (Array.isArray(res.message)) {
                    data = res.message;
                }
                setListings(data);
                localStorage.setItem("all_listings_data", JSON.stringify(data));
                if (forceRefresh) setMessage({ text: "Listings refreshed.", type: "success" });
            }
        } catch {
            setMessage({ text: "Failed to fetch listings.", type: "error" });
        } finally {
            setLoadingData(false);
            setRefreshing(false);
        }
    };

    // ── Order Mutations ───────────────────────────────────────────────────
    const addOrder = () => setOrders(prev => [...prev, emptyOrder()]);

    const removeOrder = (id) => setOrders(prev => prev.filter(o => o.id !== id));

    const updateOrder = useCallback((id, field, value) => {
        setOrders(prev => prev.map(o => {
            if (o.id !== id) return o;
            const updated = { ...o, [field]: value };
            if (field === "orderDate" && updated.orderToday) updated.orderToday = false;
            if (field === "dispatchDate" && updated.dispatchToday) updated.dispatchToday = false;
            return updated;
        }));
    }, []);

    const handleTodayChange = useCallback((id, dateField, checkboxField, checked) => {
        const today = localDateStr();
        setOrders(prev => prev.map(o => o.id !== id ? o : {
            ...o,
            [checkboxField]: checked,
            [dateField]: checked ? today : ""
        }));
    }, []);

    const openPicker = (id) => setOrders(prev => prev.map(o =>
        o.id !== id ? { ...o, pickerOpen: false } : { ...o, pickerOpen: !o.pickerOpen, pickerPage: 1 }
    ));

    const selectSku = (id, skuId) => setOrders(prev => prev.map(o =>
        o.id !== id ? o : { ...o, skuId, pickerOpen: false, pickerSearch: "", pickerPage: 1 }
    ));

    const updatePickerFilter = (id, field, value) => setOrders(prev => prev.map(o =>
        o.id !== id ? o : {
            ...o,
            [field]: value,
            // Only reset to page 1 when a filter (not the page itself) changes
            pickerPage: field === "pickerPage" ? value : 1
        }
    ));

    // ── Derived picker listings for a specific order ───────────────────────
    const getFilteredListings = (order) => {
        return listings.filter(item => {
            const matchSku = item.skuId?.toLowerCase().includes((order.pickerSearch || "").toLowerCase());
            const matchVert = order.pickerVertical ? item.vertical === order.pickerVertical : true;
            const matchMarket = order.pickerMarketplace ? (item.marketplace || "Direct") === order.pickerMarketplace : true;
            return matchSku && matchVert && matchMarket;
        });
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (orders.length === 0) {
            setMessage({ text: "Add at least one order.", type: "error" }); return;
        }
        for (const o of orders) {
            if (!o.skuId) { setMessage({ text: `Please select a SKU for order #${orders.indexOf(o) + 1}.`, type: "error" }); return; }
            if (!o.quantity || Number(o.quantity) <= 0) { setMessage({ text: `Invalid quantity for SKU: ${o.skuId}`, type: "error" }); return; }
            if (!o.orderId?.trim()) { setMessage({ text: `Order ID required for SKU: ${o.skuId}`, type: "error" }); return; }
            if (!o.orderDate?.trim()) { setMessage({ text: `Order Date required for SKU: ${o.skuId}`, type: "error" }); return; }
        }

        setIsSubmitting(true);
        const pin = sessionStorage.getItem("app_pin");

        const payload = {
            pin,
            action: "bulkRecordSales",
            salesItems: orders.map(o => ({
                skuId: o.skuId,
                quantity: Number(o.quantity),
                orderId: o.orderId,
                lineId: o.lineId,
                orderDate: o.orderDate,
                dispatchDate: o.dispatchDate,
                status: o.dispatchDate ? "DISPATCHED" : "ORDERED"
            }))
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(r => r.json());

            if (response.status === 200) {
                setMessage({ text: response.message || `Successfully recorded ${orders.length} sales entries.`, type: "success" });
                setOrders([emptyOrder()]);
            } else if (response.status === 422 && response.data && typeof response.data === "object") {
                const err = response.data;
                let msg = err.message || "Update cancelled.";
                if (err.duplicates?.length) msg += ` Duplicates: ${err.duplicates.join(" | ")}`;
                if (err.invalidStatuses?.length) msg += ` Invalid statuses: ${err.invalidStatuses.join(" | ")}`;
                setMessage({ text: msg, type: "error" });
            } else {
                console.log("Error Response:", response);
                setMessage({ text: response.message || "Failed to submit data.", type: "error" });
            }
        } catch {
            setMessage({ text: "Network error occurred.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Add Sales Log</h1>

            <div className={styles.layout}>

                {/* ── Order Sections ── */}
                {orders.map((order, idx) => {
                    const filtered = getFilteredListings(order);
                    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
                    const paginated = filtered.slice((order.pickerPage - 1) * PAGE_SIZE, order.pickerPage * PAGE_SIZE);

                    return (
                        <div key={order.id} className={styles.orderCard}>

                            {/* Card header */}
                            <div className={styles.orderHeader}>
                                <h2 className={styles.orderTitle}>Order {idx + 1}</h2>
                                {orders.length > 1 && (
                                    <button className={styles.removeOrderBtn} onClick={() => removeOrder(order.id)} title="Remove order">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6l-1 14H6L5 6"></path>
                                            <path d="M10 11v6M14 11v6"></path>
                                            <path d="M9 6V4h6v2"></path>
                                        </svg>
                                        Remove
                                    </button>
                                )}
                            </div>

                            {/* Row 1: SKU | Qty | Order ID | Line ID */}
                            <div className={styles.formRow}>

                                {/* SKU picker trigger */}
                                <div className={styles.inputGroup} style={{ minWidth: "200px" }}>
                                    <label className={styles.inputLabel}>SKU ID*</label>
                                    <button
                                        type="button"
                                        className={`${styles.skuPickerBtn} ${order.skuId ? styles.skuSelected : ""}`}
                                        onClick={() => openPicker(order.id)}
                                    >
                                        {order.skuId || "Select SKU…"}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points={order.pickerOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                                        </svg>
                                    </button>
                                </div>

                                {/* Qty */}
                                <div className={styles.inputGroup} style={{ maxWidth: "90px" }}>
                                    <label className={styles.inputLabel}>Qty</label>
                                    <input type="number" min="1" value={order.quantity}
                                        onChange={e => updateOrder(order.id, "quantity", e.target.value)}
                                        className={styles.itemInput} placeholder="1" />
                                </div>

                                {/* Order ID */}
                                <div className={styles.inputGroup}>
                                    <div className={styles.labelRow}>
                                        <label className={styles.inputLabel}>Order ID*</label>
                                        <div className={styles.iconBtnGroup}>
                                            <button type="button" className={styles.iconBtn} title="Copy Order ID"
                                                onClick={() => navigator.clipboard.writeText(order.orderId)}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                            <button type="button" className={styles.iconBtn} title="Paste into Order ID"
                                                onClick={async () => { const t = await navigator.clipboard.readText(); updateOrder(order.id, "orderId", t); }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <input type="text" value={order.orderId}
                                        onChange={e => updateOrder(order.id, "orderId", e.target.value)}
                                        className={styles.itemInput} placeholder="e.g. 123-456" />
                                </div>

                                {/* Line ID */}
                                <div className={styles.inputGroup}>
                                    <div className={styles.labelRow}>
                                        <label className={styles.inputLabel}>Line ID</label>
                                        <div className={styles.iconBtnGroup}>
                                            <button type="button" className={styles.iconBtn} title="Copy Line ID"
                                                onClick={() => navigator.clipboard.writeText(order.lineId)}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                            <button type="button" className={styles.iconBtn} title="Paste into Line ID"
                                                onClick={async () => { const t = await navigator.clipboard.readText(); updateOrder(order.id, "lineId", t); }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <input type="text" value={order.lineId}
                                        onChange={e => updateOrder(order.id, "lineId", e.target.value)}
                                        className={styles.itemInput} placeholder="Optional" />
                                </div>
                            </div>

                            {/* Row 2: Order Date | Dispatch Date */}
                            <div className={styles.formRow}>
                                <div className={styles.inputGroup}>
                                    <div className={styles.labelRow}>
                                        <label className={styles.inputLabel}>Order Date*</label>
                                        <label className={styles.checkboxLabel}>
                                            <input type="checkbox" checked={order.orderToday}
                                                onChange={e => handleTodayChange(order.id, "orderDate", "orderToday", e.target.checked)}
                                                className={styles.smallCheckbox} /> Today
                                        </label>
                                    </div>
                                    <input type="date" value={order.orderDate}
                                        onChange={e => updateOrder(order.id, "orderDate", e.target.value)}
                                        className={styles.itemInput} />
                                </div>

                                <div className={styles.inputGroup}>
                                    <div className={styles.labelRow}>
                                        <label className={styles.inputLabel}>Dispatch Date</label>
                                        <label className={styles.checkboxLabel}>
                                            <input type="checkbox" checked={order.dispatchToday}
                                                onChange={e => handleTodayChange(order.id, "dispatchDate", "dispatchToday", e.target.checked)}
                                                className={styles.smallCheckbox} /> Today
                                        </label>
                                    </div>
                                    <input type="date" value={order.dispatchDate}
                                        onChange={e => updateOrder(order.id, "dispatchDate", e.target.value)}
                                        className={styles.itemInput} />
                                </div>
                            </div>

                            {/* Inline SKU picker */}
                            {order.pickerOpen && (
                                <div className={styles.pickerPanel}>
                                    <div className={styles.pickerFilters}>
                                        <input type="text" placeholder="Search SKU…"
                                            value={order.pickerSearch}
                                            onChange={e => updatePickerFilter(order.id, "pickerSearch", e.target.value)}
                                            className={styles.filterInput} />

                                        <select
                                            value={order.pickerMarketplace}
                                            onChange={e => updatePickerFilter(order.id, "pickerMarketplace", e.target.value)}
                                            className={styles.filterInput}
                                        >
                                            <option value="">All Marketplaces</option>
                                            <option value="Amazon">Amazon</option>
                                            <option value="Flipkart">Flipkart</option>
                                            <option value="Shopsy">Shopsy</option>
                                            <option value="Myntra">Myntra</option>
                                            <option value="Meesho">Meesho</option>
                                            <option value="Ajio">Ajio</option>
                                            <option value="Website">Website</option>
                                            <option value="Other">Other</option>
                                        </select>

                                        <button
                                            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`}
                                            onClick={() => { setOrders(p => p.map(o => ({ ...o, pickerOpen: false }))); fetchListingsData(true); }}
                                            disabled={refreshing} title="Refresh">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="23 4 23 10 17 10"></polyline>
                                                <polyline points="1 20 1 14 7 14"></polyline>
                                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                            </svg>
                                        </button>
                                    </div>

                                    {loadingData ? (
                                        <div className={styles.loading}>Loading listings…</div>
                                    ) : filtered.length > 0 ? (
                                        <>
                                            <div className={styles.tableContainer}>
                                                <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th>SKU ID</th>
                                                            <th>Images &amp; Inventory IDs</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginated.map(item => (
                                                            <tr key={item.skuId}
                                                                className={`${styles.clickableRow} ${order.skuId === item.skuId ? styles.selectedRow : ""}`}
                                                                onClick={() => selectSku(order.id, item.skuId)}>
                                                                <td className={styles.skuCell}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                        <span>{item.skuId}</span>
                                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                                            {item.vertical} • {item.marketplace || 'Direct'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className={styles.tdImage}>
                                                                    {item.inventoryItems?.length > 0 ? (
                                                                        <div className={styles.listThumbStack}>
                                                                            {item.inventoryItems.map((inv, i) => (
                                                                                <div key={i} className={styles.invThumbItem}>
                                                                                    {inv.imageId ? (
                                                                                        <div className={styles.listThumbnailContainer}>
                                                                                            <Image src={`https://drive.google.com/thumbnail?id=${inv.imageId}&sz=w100`}
                                                                                                alt={inv.inventoryId} fill className={styles.listThumbnail}
                                                                                                unoptimized referrerPolicy="no-referrer" />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className={styles.listThumbnailContainer} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                                            <span className={styles.listThumbnailPlaceholder}>?</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <span className={styles.invIdLabel}>{inv.inventoryId}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : <span className={styles.listThumbnailPlaceholder}>-</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {/* Picker pagination */}
                                            <div className={styles.pagination}>
                                                <span className={styles.pageInfo}>
                                                    {Math.min((order.pickerPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(order.pickerPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                                                </span>
                                                <div className={styles.pageControls}>
                                                    <button className={styles.pageBtn} disabled={order.pickerPage === 1}
                                                        onClick={() => updatePickerFilter(order.id, "pickerPage", order.pickerPage - 1)}>Prev</button>
                                                    <button className={styles.pageBtn} disabled={order.pickerPage === totalPages}
                                                        onClick={() => updatePickerFilter(order.id, "pickerPage", order.pickerPage + 1)}>Next</button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.emptyState}>No listings found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* ── Add Order + Submit ── */}
                <div className={styles.actionsBar}>
                    <button className={styles.addOrderBtn} onClick={addOrder} type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Another Order
                    </button>

                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting} type="button">
                        {isSubmitting ? "Submitting…" : `Submit ${orders.length} Sale${orders.length > 1 ? "s" : ""}`}
                    </button>
                </div>
            </div>

            <Toast message={message} onClose={() => setMessage({ text: "", type: "" })} />
        </div>
    );
}
