"use client";
import { toast } from "sonner";

import React, { useState, useEffect, useCallback, useRef } from "react";
import PageShell from "@/components/ui/PageShell/PageShell";
import styles from "./page.module.css";

import { parseSearchQuery, matchesSearchTerms } from "../../utils/searchUtils";
import { MONTHS, emptyRow, computeNetUnits, hasNetMismatch } from "./addSalesLogConfig";
import SalesLogHeader from "./_components/SalesLogHeader/SalesLogHeader";
import PeriodSelector from "./_components/PeriodSelector/PeriodSelector";
import BulkImport from "./_components/BulkImport/BulkImport";
import SalesRowCard from "./_components/SalesRowCard/SalesRowCard";
import TotalsSummary from "./_components/TotalsSummary/TotalsSummary";
import ActionsBar from "./_components/ActionsBar/ActionsBar";
import ConflictModal from "./_components/ConflictModal/ConflictModal";

// ─── Component ───────────────────────────────────────────────────────────────
export default function AddSalesLog() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([emptyRow()]);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Conflict modal state
  const [conflicts, setConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDecisions, setConflictDecisions] = useState({});

  // File Upload State
  const fileInputRef = useRef(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

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
    setLoadingListings(true);
    try {
      const res = await fetch("/api/employee/listing").then((r) => r.json());
      if (res.success || Array.isArray(res.data)) {
        const data = Array.isArray(res.data) ? res.data : [];
        setListings(data);
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
    const { includeTerms, excludeTerms } = parseSearchQuery(debouncedPickerSearch);
    return listings.filter((item) =>
      matchesSearchTerms(item.skuId, includeTerms, excludeTerms)
    );
  }, [listings, debouncedPickerSearch]);

  // ── File Upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { parseSKULevelPL } = await import('@/utils/xlsxParser');
      const parsedData = parseSKULevelPL(arrayBuffer);

      if (!parsedData || parsedData.length === 0) {
        toast.error("No valid data found or incorrect format.", { id: "app-feedback", duration: 3000 });
        return;
      }

      // Filter out rows without SKU ID
      const validData = parsedData.filter(item => item.skuId && String(item.skuId).trim() !== "");
      
      if (validData.length === 0) {
          toast.error("No valid SKU IDs found in the file.", { id: "app-feedback", duration: 3000 });
          return;
      }

      const newRows = validData.map(item => ({
        ...emptyRow(),
        skuId: String(item.skuId).trim(),
        salesChannel: item.salesChannel ? String(item.salesChannel).trim() : "",
        grossUnits: String(item.grossUnits || 0),
        logisticsReturns: String(item.logisticsReturns || 0),
        customerReturns: String(item.customerReturns || 0),
        cancellations: String(item.cancellations || 0),
        netUnits: String(item.netUnits || 0),
        netUnitsManual: true, 
        netSales: String(item.netSales || 0),
        totalExpenses: String(item.totalExpenses || 0),
        otherBenefits: String(item.otherBenefits || 0),
        projectedBankSettlement: String(item.projectedBankSettlement || 0)
      }));

      setRows(prev => {
        // If there's only one empty row, replace it
        if (prev.length === 1 && !prev[0].skuId && prev[0].grossUnits === "") {
          return newRows;
        }
        return [...prev, ...newRows];
      });
      
      toast.success(`Successfully imported ${newRows.length} SKUs from Flipkart report.`, { id: "app-feedback", duration: 3000 });
    } catch (err) {
      console.error("File upload error:", err);
      toast.error(err.message || "Failed to parse Excel file.", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
  const submitToApi = async (items, forceOverrides = [], forceKeepBoth = []) => {
    const res = await fetch("/api/employee/sales-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, forceOverrides, forceKeepBoth }),
    });
    return res.json();
  };

  // ── Primary submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // 1. Validate SKU selection
    const missingSkuIdx = rows.findIndex((r) => !r.skuId);
    if (missingSkuIdx !== -1) {
      toast.error(`Please select a SKU for entry #${missingSkuIdx + 1}.`, { id: "app-feedback", duration: 3000 });
      return;
    }

    // 2. Block on net units mismatch
    const mismatchRows = rows.filter((r) => hasNetMismatch(r));
    if (mismatchRows.length > 0) {
      toast.error(`Net Units mismatch in ${mismatchRows.length} row(s). Please correct the values or click ↺ Auto to reset to the calculated amount.`, { id: "app-feedback", duration: 3000 });
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
        toast.error(res.error || "Failed to submit records.", { id: "app-feedback", duration: 3000 });
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
          toast.error(`${res.inserted + res.updated} record(s) saved. ${res.conflicts.length} duplicate(s) need your review.`, { id: "app-feedback", duration: 3000 });
        }
      } else {
        toast.success(`✓ Saved ${res.inserted} new and updated ${res.updated} record(s) for ${MONTHS[month - 1]} ${year}.`, { id: "app-feedback", duration: 3000 });
        setRows([emptyRow()]);
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Conflict resolution submit ─────────────────────────────────────────────
  const handleConflictResolve = async () => {
    const overrideKeys = Object.entries(conflictDecisions)
      .filter(([, v]) => v === "override")
      .map(([k]) => k);

    const keepKeys = Object.entries(conflictDecisions)
      .filter(([, v]) => v === "keep")
      .map(([k]) => k);

    setShowConflictModal(false);
    setConflicts([]);

    const chosenKeys = [...overrideKeys, ...keepKeys];
    if (chosenKeys.length === 0) {
      toast.error("All conflicting records were skipped. No changes made.", { id: "app-feedback", duration: 3000 });
      return;
    }

    // Re-submit the items chosen for override OR keep
    const resolvedItems = conflicts
      .filter((c) => chosenKeys.includes(c.key))
      .map((c) => c.incoming);

    setIsSubmitting(true);
    try {
      const res = await submitToApi(resolvedItems, overrideKeys, keepKeys);
      if (res.success) {
        toast.success(`✓ Processed duplicate records: saved ${res.inserted} and updated ${res.updated} for ${MONTHS[month - 1]} ${year}.`, { id: "app-feedback", duration: 3000 });
        setRows([emptyRow()]);
      } else {
        toast.error(res.error || "Failed to resolve duplicate records.", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error during conflict resolution.", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Calculate Totals ──────────────────────────────────────────────────────
  const totals = rows.reduce((acc, row) => {
    acc.grossUnits += Number(row.grossUnits) || 0;
    acc.logisticsReturns += Number(row.logisticsReturns) || 0;
    acc.customerReturns += Number(row.customerReturns) || 0;
    acc.cancellations += Number(row.cancellations) || 0;
    acc.netUnits += Number(row.netUnits) || 0;
    acc.netSales += Number(row.netSales) || 0;
    acc.totalExpenses += Number(row.totalExpenses) || 0;
    acc.otherBenefits += Number(row.otherBenefits) || 0;
    acc.projectedBankSettlement += Number(row.projectedBankSettlement) || 0;
    return acc;
  }, {
    grossUnits: 0, logisticsReturns: 0, customerReturns: 0, cancellations: 0,
    netUnits: 0, netSales: 0, totalExpenses: 0, otherBenefits: 0, projectedBankSettlement: 0
  });

  // ── Named JSX handlers ────────────────────────────────────────────────────
  const handleMonthChange = (e) => setMonth(Number(e.target.value));
  const handleYearChange = (e) => setYear(Number(e.target.value));
  const handleUploadClick = () => fileInputRef.current?.click();
  const closeConflictModal = () => setShowConflictModal(false);
  const handleDecisionChange = (key, decision) =>
    setConflictDecisions((prev) => ({ ...prev, [key]: decision }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell className={styles.shell}>
      {/* ── Page Header ── */}
      <SalesLogHeader month={month} year={year} />

      <div className={styles.setup}>
        {/* ── Period Selector ── */}
        <PeriodSelector month={month} year={year} years={years}
          onMonthChange={handleMonthChange} onYearChange={handleYearChange} />

        {/* ── Bulk Import Section ── */}
        <BulkImport fileInputRef={fileInputRef} isParsingFile={isParsingFile}
          onFileUpload={handleFileUpload} onUploadClick={handleUploadClick} />
      </div>

      {/* ── SKU Rows ── */}
      <div className={styles.rows}>
        {rows.map((row, idx) => {
          const mismatch = hasNetMismatch(row);
          const filteredListings = globalFilteredListings;

          return (
            <SalesRowCard
              key={row.id} row={row} idx={idx} mismatch={mismatch} canRemove={rows.length > 1}
              loadingListings={loadingListings} filteredListings={filteredListings}
              onRemoveRow={removeRow} onOpenPicker={openPicker} onUpdateRow={updateRow}
              onPickerSearch={handlePickerSearch} onSelectSku={selectSku}
              onResetNetUnits={resetNetUnitsToAuto}
            />
          );
        })}
      </div>

      {/* ── Totals Section ── */}
      {rows.length > 0 && <TotalsSummary totals={totals} />}

      {/* ── Actions Bar ── */}
      <ActionsBar rowCount={rows.length} month={month} year={year}
        isSubmitting={isSubmitting} onAddRow={addRow} onSubmit={handleSubmit} />

      {/* ── Conflict Compare Modal ── */}
      <ConflictModal open={showConflictModal} conflicts={conflicts} conflictDecisions={conflictDecisions}
        month={month} year={year} onClose={closeConflictModal}
        onDecisionChange={handleDecisionChange} onConfirm={handleConflictResolve} />
    </PageShell>
  );
}
