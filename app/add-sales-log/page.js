"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SALES_CHANNELS = [
  "Amazon", "Flipkart", "Shopsy", "Myntra", "Meesho", "Ajio", "Website", "Other",
];

const COMPARE_FIELDS = [
  { key: "salesChannel", label: "Sales Channel" },
  { key: "grossUnits", label: "Gross Units" },
  { key: "logisticsReturns", label: "Logistics Returns" },
  { key: "customerReturns", label: "Customer Returns" },
  { key: "cancellations", label: "Cancellations" },
  { key: "netUnits", label: "Net Units" },
  { key: "netSales", label: "Net Sales (₹)" },
  { key: "totalExpenses", label: "Total Expenses (₹)" },
  { key: "otherBenefits", label: "Other Benefits (₹)" },
  { key: "projectedBankSettlement", label: "Proj. Bank Settlement (₹)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
let _rowCounter = 0;
const newRowId = () => `row_${++_rowCounter}_${Date.now()}`;

const emptyRow = () => ({
  id: newRowId(),
  skuId: "",
  salesChannel: "",
  grossUnits: "",
  logisticsReturns: "",
  customerReturns: "",
  cancellations: "",
  netUnits: "",
  netUnitsManual: false,
  netSales: "",
  totalExpenses: "",
  otherBenefits: "",
  projectedBankSettlement: "",
  pickerOpen: false,
  pickerSearch: "",
});

const computeNetUnits = (row) => {
  const g = parseFloat(row.grossUnits) || 0;
  const l = parseFloat(row.logisticsReturns) || 0;
  const c = parseFloat(row.customerReturns) || 0;
  const ca = parseFloat(row.cancellations) || 0;
  return g - l - c - ca;
};

const hasNetMismatch = (row) => {
  if (!row.netUnitsManual || row.netUnits === "") return false;
  const computed = computeNetUnits(row);
  const entered = parseFloat(row.netUnits);
  return !isNaN(entered) && computed !== entered;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AddSalesLog() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([emptyRow()]);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Conflict modal state
  const [conflicts, setConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDecisions, setConflictDecisions] = useState({});

  // ── Debounced SKU search ──────────────────────────────────────────────────
  // pickerSearch (in row state) = immediate input value → smooth typing
  // debouncedPickerSearch = delayed value used for actual list filtering
  const [debouncedPickerSearch, setDebouncedPickerSearch] = useState("");
  const debounceRef = useRef(null);

  // Clear debounce timer on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  // ── Load listings ─────────────────────────────────────────────────────────
  useEffect(() => { loadListings(); }, []);

  const loadListings = async () => {
    const cached = localStorage.getItem("all_listings_data");
    if (cached) {
      try { setListings(JSON.parse(cached)); return; } catch (e) { /* ignore */ }
    }
    setLoadingListings(true);
    try {
      const pin = sessionStorage.getItem("app_pin");
      const res = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ pin, action: "getListing", page: 1, pageSize: 50000, sort: "newest_first" }),
      }).then((r) => r.json());
      if (res.status === 200) {
        const data =
          res.data?.listings || res.message?.listings ||
          (Array.isArray(res.data) ? res.data : null) ||
          (Array.isArray(res.message) ? res.message : []);
        setListings(Array.isArray(data) ? data : []);
        localStorage.setItem("all_listings_data", JSON.stringify(data));
      }
    } catch (e) {
      console.error("Failed to load listings", e);
    } finally {
      setLoadingListings(false);
    }
  };

  // ── Memoized Filtered Listings ────────────────────────────────────────────
  const globalFilteredListings = React.useMemo(() => {
    if (!debouncedPickerSearch) return listings;
    const lowerSearch = debouncedPickerSearch.toLowerCase();
    return listings.filter((item) =>
      item.skuId?.toLowerCase().includes(lowerSearch)
    );
  }, [listings, debouncedPickerSearch]);

  // ── Row mutations ─────────────────────────────────────────────────────────
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = useCallback((id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };

        // Auto-calc net units when component fields change (if not manually overridden)
        const unitFields = ["grossUnits", "logisticsReturns", "customerReturns", "cancellations"];
        if (unitFields.includes(field) && !r.netUnitsManual) {
          const g = parseFloat(field === "grossUnits" ? value : r.grossUnits) || 0;
          const l = parseFloat(field === "logisticsReturns" ? value : r.logisticsReturns) || 0;
          const c = parseFloat(field === "customerReturns" ? value : r.customerReturns) || 0;
          const ca = parseFloat(field === "cancellations" ? value : r.cancellations) || 0;
          updated.netUnits = String(g - l - c - ca);
        }

        // Mark as manually entered when user types into net units
        if (field === "netUnits") {
          updated.netUnitsManual = true;
        }

        return updated;
      })
    );
  }, []);

  const resetNetUnitsToAuto = (id) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, netUnitsManual: false, netUnits: String(computeNetUnits(r)) };
      })
    );
  };

  const openPicker = (id) => {
    // Reset debounced search whenever a picker opens or closes
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDebouncedPickerSearch("");
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, pickerOpen: !r.pickerOpen, pickerSearch: "" }
          : { ...r, pickerOpen: false }
      )
    );
  };

  // Update the immediate input value instantly, but debounce the filter query
  const handlePickerSearch = useCallback((id, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, pickerSearch: value } : r)));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedPickerSearch(value);
    }, 300);
  }, []);

  const selectSku = (id, skuId) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDebouncedPickerSearch("");
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, skuId, pickerOpen: false, pickerSearch: "" } : r
      )
    );
  };

  // ── API call ──────────────────────────────────────────────────────────────
  const submitToApi = async (items, forceOverrides = []) => {
    const res = await fetch("/api/employee/sales-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, forceOverrides }),
    });
    return res.json();
  };

  // ── Primary submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // 1. Validate SKU selection
    const missingSkuIdx = rows.findIndex((r) => !r.skuId);
    if (missingSkuIdx !== -1) {
      setMessage({ text: `Please select a SKU for entry #${missingSkuIdx + 1}.`, type: "error" });
      return;
    }

    // 2. Block on net units mismatch
    const mismatchRows = rows.filter((r) => hasNetMismatch(r));
    if (mismatchRows.length > 0) {
      setMessage({
        text: `Net Units mismatch in ${mismatchRows.length} row(s). Please correct the values or click ↺ Auto to reset to the calculated amount.`,
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const items = rows.map((r) => ({
        skuId: r.skuId,
        month,
        year,
        salesChannel: r.salesChannel || null,
        grossUnits: parseFloat(r.grossUnits) || 0,
        logisticsReturns: parseFloat(r.logisticsReturns) || 0,
        customerReturns: parseFloat(r.customerReturns) || 0,
        cancellations: parseFloat(r.cancellations) || 0,
        netUnits: parseFloat(r.netUnits) || 0,
        netSales: parseFloat(r.netSales) || 0,
        totalExpenses: parseFloat(r.totalExpenses) || 0,
        otherBenefits: parseFloat(r.otherBenefits) || 0,
        projectedBankSettlement: parseFloat(r.projectedBankSettlement) || 0,
      }));

      const res = await submitToApi(items);

      if (!res.success && !res.conflicts) {
        setMessage({ text: res.error || "Failed to submit records.", type: "error" });
        return;
      }

      if (res.conflicts && res.conflicts.length > 0) {
        // Initialize all decisions to "skip"
        const decisions = {};
        res.conflicts.forEach((c) => { decisions[c.key] = "skip"; });
        setConflicts(res.conflicts);
        setConflictDecisions(decisions);
        setShowConflictModal(true);

        if (res.inserted > 0 || res.updated > 0) {
          setMessage({
            text: `${res.inserted + res.updated} record(s) saved. ${res.conflicts.length} duplicate(s) need your review.`,
            type: "error",
          });
        }
      } else {
        setMessage({
          text: `✓ Saved ${res.inserted} new and updated ${res.updated} record(s) for ${MONTHS[month - 1]} ${year}.`,
          type: "success",
        });
        setRows([emptyRow()]);
      }
    } catch {
      setMessage({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Conflict resolution submit ─────────────────────────────────────────────
  const handleConflictResolve = async () => {
    const overrideKeys = Object.entries(conflictDecisions)
      .filter(([, v]) => v === "override")
      .map(([k]) => k);

    setShowConflictModal(false);
    setConflicts([]);

    if (overrideKeys.length === 0) {
      setMessage({ text: "All conflicting records were skipped. No changes made.", type: "error" });
      return;
    }

    // Only re-submit the items chosen for override
    const overrideItems = conflicts
      .filter((c) => overrideKeys.includes(c.key))
      .map((c) => c.incoming);

    setIsSubmitting(true);
    try {
      const res = await submitToApi(overrideItems, overrideKeys);
      if (res.success) {
        setMessage({
          text: `✓ Overrode ${res.updated} record(s) for ${MONTHS[month - 1]} ${year}.`,
          type: "success",
        });
        setRows([emptyRow()]);
      } else {
        setMessage({ text: res.error || "Failed to override records.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error during override.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Monthly Sales Log</h1>
          <p className={styles.subtitle}>Record aggregated sales data per SKU for a given month</p>
        </div>
        <div className={styles.periodBadge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {MONTHS[month - 1]} {year}
        </div>
      </div>

      {/* ── Period Selector ── */}
      <div className={styles.periodCard}>
        <div className={styles.periodCardTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Recording Period
        </div>
        <div className={styles.periodSelectors}>
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Month</label>
            <select
              id="month-select"
              className={styles.periodSelect}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className={styles.selectorGroup}>
            <label className={styles.selectorLabel}>Year</label>
            <select
              id="year-select"
              className={styles.periodSelect}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── SKU Rows ── */}
      <div className={styles.layout}>
        {rows.map((row, idx) => {
          const mismatch = hasNetMismatch(row);
          const filteredListings = globalFilteredListings;

          return (
            <div key={row.id} className={`${styles.rowCard} ${mismatch ? styles.rowMismatch : ""}`}>
              {/* Card header */}
              <div className={styles.rowHeader}>
                <div className={styles.rowHeaderLeft}>
                  <span className={styles.rowIndex}>{idx + 1}</span>
                  <span className={styles.rowLabel}>
                    {row.skuId ? row.skuId : "New SKU Entry"}
                  </span>
                  {row.salesChannel && (
                    <span className={styles.channelTag}>{row.salesChannel}</span>
                  )}
                </div>
                {rows.length > 1 && (
                  <button className={styles.removeBtn} onClick={() => removeRow(row.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-1 14H6L5 6"></path>
                      <path d="M10 11v6M14 11v6"></path>
                      <path d="M9 6V4h6v2"></path>
                    </svg>
                    Remove
                  </button>
                )}
              </div>

              {/* Row 1: SKU + Channel */}
              <div className={styles.formRow}>
                <div className={styles.inputGroup} style={{ minWidth: "220px", maxWidth: "340px" }}>
                  <label className={styles.inputLabel} htmlFor={`sku-${row.id}`}>SKU ID *</label>
                  <button
                    id={`sku-${row.id}`}
                    type="button"
                    className={`${styles.skuPickerBtn} ${row.skuId ? styles.skuSelected : ""}`}
                    onClick={() => openPicker(row.id)}
                  >
                    {row.skuId || "Select SKU…"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points={row.pickerOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                    </svg>
                  </button>
                </div>

                <div className={styles.inputGroup} style={{ minWidth: "180px", maxWidth: "260px" }}>
                  <label className={styles.inputLabel} htmlFor={`channel-${row.id}`}>Sales Channel</label>
                  <select
                    id={`channel-${row.id}`}
                    className={styles.itemSelect}
                    value={row.salesChannel}
                    onChange={(e) => updateRow(row.id, "salesChannel", e.target.value)}
                  >
                    <option value="">— Select Channel —</option>
                    {SALES_CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inline SKU picker */}
              {row.pickerOpen && (
                <div className={styles.pickerPanel}>
                  <div className={styles.pickerSearchWrap}>
                    <svg className={styles.pickerSearchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search SKU ID…"
                      value={row.pickerSearch}
                      onChange={(e) => handlePickerSearch(row.id, e.target.value)}
                      className={styles.pickerSearch}
                      autoFocus
                    />
                  </div>
                  <div className={styles.pickerList}>
                    {loadingListings ? (
                      <div className={styles.pickerEmpty}>Loading listings…</div>
                    ) : filteredListings.length === 0 ? (
                      <div className={styles.pickerEmpty}>No SKUs match your search.</div>
                    ) : (
                      filteredListings.slice(0, 60).map((item) => (
                        <div
                          key={item.skuId}
                          className={`${styles.pickerItem} ${row.skuId === item.skuId ? styles.pickerItemSelected : ""}`}
                          onClick={() => selectSku(row.id, item.skuId)}
                        >
                          <span className={styles.pickerSkuId}>{item.skuId}</span>
                          <span className={styles.pickerMeta}>
                            {item.vertical} · {item.marketplace || "Direct"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Section: Unit Metrics */}
              <div className={styles.metricsSection}>
                <div className={styles.metricsSectionTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  Unit Metrics
                </div>
                <div className={styles.formRow}>
                  {[
                    { key: "grossUnits", label: "Gross Units" },
                    { key: "logisticsReturns", label: "Logistics Returns" },
                    { key: "customerReturns", label: "Customer Returns" },
                    { key: "cancellations", label: "Cancellations" },
                  ].map(({ key, label }) => (
                    <div key={key} className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor={`${key}-${row.id}`}>{label}</label>
                      <input
                        id={`${key}-${row.id}`}
                        type="number"
                        min="0"
                        value={row[key]}
                        onChange={(e) => updateRow(row.id, key, e.target.value)}
                        className={styles.itemInput}
                        placeholder="0"
                      />
                    </div>
                  ))}

                  {/* Net Units — auto-calculated */}
                  <div className={styles.inputGroup}>
                    <div className={styles.netUnitsLabelRow}>
                      <label className={styles.inputLabel} htmlFor={`netUnits-${row.id}`}>Net Units</label>
                      {row.netUnitsManual ? (
                        <button
                          type="button"
                          className={styles.autoResetBtn}
                          onClick={() => resetNetUnitsToAuto(row.id)}
                          title="Reset to auto-calculated"
                        >
                          ↺ Auto
                        </button>
                      ) : (
                        <span className={styles.autoTag}>Auto</span>
                      )}
                    </div>
                    <input
                      id={`netUnits-${row.id}`}
                      type="number"
                      value={row.netUnits}
                      onChange={(e) => updateRow(row.id, "netUnits", e.target.value)}
                      className={`${styles.itemInput} ${mismatch ? styles.mismatchInput : ""} ${!row.netUnitsManual ? styles.autoInput : ""}`}
                      placeholder="0"
                    />
                    {mismatch && (
                      <span className={styles.mismatchHint}>
                        ⚠ Calculated: {computeNetUnits(row)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Financial Metrics */}
              <div className={styles.metricsSection}>
                <div className={styles.metricsSectionTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Financial Metrics
                </div>
                <div className={styles.formRow}>
                  {[
                    { key: "netSales", label: "Net Sales (₹)" },
                    { key: "totalExpenses", label: "Total Expenses (₹)" },
                    { key: "otherBenefits", label: "Other Benefits (₹)" },
                    { key: "projectedBankSettlement", label: "Proj. Bank Settlement (₹)" },
                  ].map(({ key, label }) => (
                    <div key={key} className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor={`${key}-${row.id}`}>{label}</label>
                      <div className={styles.currencyInputWrap}>
                        <span className={styles.currencySymbol}>₹</span>
                        <input
                          id={`${key}-${row.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={row[key]}
                          onChange={(e) => updateRow(row.id, key, e.target.value)}
                          className={`${styles.itemInput} ${styles.currencyInput}`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Actions Bar ── */}
        <div className={styles.actionsBar}>
          <button className={styles.addRowBtn} onClick={addRow} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Another SKU
          </button>
          <div className={styles.actionsMeta}>
            <span className={styles.rowCount}>{rows.length} SKU{rows.length > 1 ? "s" : ""} · {MONTHS[month - 1]} {year}</span>
            <button
              id="submit-sales-log"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Saving…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Save {rows.length} Record{rows.length > 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Conflict Compare Modal ── */}
      {showConflictModal && (
        <div className={styles.modalOverlay} onClick={() => setShowConflictModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <div className={styles.modalWarningIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                Duplicate Records Detected
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowConflictModal(false)}
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p className={styles.modalSubtitle}>
              {conflicts.length} record(s) already exist for {MONTHS[month - 1]} {year}. Compare old vs. new data and choose to <strong>Override</strong> or <strong>Skip</strong>.
            </p>

            {/* Conflict list */}
            <div className={styles.conflictList}>
              {conflicts.map((conflict) => (
                <div key={conflict.key} className={styles.conflictItem}>
                  <div className={styles.conflictItemHeader}>
                    <div className={styles.conflictItemLeft}>
                      <span className={styles.conflictSkuId}>{conflict.incoming.skuId}</span>
                      <span className={styles.conflictPeriod}>
                        {MONTHS[(conflict.existing.month ?? month) - 1]} {conflict.existing.year ?? year}
                      </span>
                    </div>
                    <div className={styles.decisionGroup}>
                      <button
                        className={`${styles.decisionBtn} ${styles.overrideBtn} ${conflictDecisions[conflict.key] === "override" ? styles.decisionActive : ""}`}
                        onClick={() =>
                          setConflictDecisions((prev) => ({ ...prev, [conflict.key]: "override" }))
                        }
                      >
                        Override
                      </button>
                      <button
                        className={`${styles.decisionBtn} ${styles.skipBtn} ${conflictDecisions[conflict.key] === "skip" ? styles.decisionActive : ""}`}
                        onClick={() =>
                          setConflictDecisions((prev) => ({ ...prev, [conflict.key]: "skip" }))
                        }
                      >
                        Skip
                      </button>
                    </div>
                  </div>

                  {/* Compare table */}
                  <div className={styles.compareTable}>
                    <div className={styles.compareHeaderRow}>
                      <span className={styles.compareFieldCol}>Field</span>
                      <span className={styles.compareOldCol}>Existing</span>
                      <span className={styles.compareNewCol}>New</span>
                    </div>
                    {COMPARE_FIELDS.map(({ key, label }) => {
                      const oldVal = conflict.existing[key];
                      const newVal = conflict.incoming[key];
                      const changed = String(oldVal ?? "") !== String(newVal ?? "");
                      return (
                        <div key={key} className={`${styles.compareRow} ${changed ? styles.compareChanged : ""}`}>
                          <span className={styles.compareFieldName}>{label}</span>
                          <span className={styles.compareOldVal}>{oldVal ?? "—"}</span>
                          <span className={styles.compareNewVal}>{newVal ?? "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className={styles.modalFooter}>
              <div className={styles.modalFooterInfo}>
                {Object.values(conflictDecisions).filter((v) => v === "override").length} override ·{" "}
                {Object.values(conflictDecisions).filter((v) => v === "skip").length} skip
              </div>
              <div className={styles.modalFooterActions}>
                <button className={styles.modalCancelBtn} onClick={() => setShowConflictModal(false)}>
                  Cancel
                </button>
                <button className={styles.modalConfirmBtn} onClick={handleConflictResolve}>
                  Confirm Decisions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} onClose={() => setMessage({ text: "", type: "" })} />
    </div>
  );
}
