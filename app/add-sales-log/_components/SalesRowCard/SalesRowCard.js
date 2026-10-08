import Icon from "@/components/ui/Icon/Icon";
import styles from "./SalesRowCard.module.css";
import { SALES_CHANNELS, computeNetUnits } from "../../addSalesLogConfig";
import SalesRowHeader from "../SalesRowHeader/SalesRowHeader";
import SkuPickerPanel from "../SkuPickerPanel/SkuPickerPanel";

export default function SalesRowCard({
  row,
  idx,
  mismatch,
  canRemove,
  loadingListings,
  filteredListings,
  onRemoveRow,
  onOpenPicker,
  onUpdateRow,
  onPickerSearch,
  onSelectSku,
  onResetNetUnits,
}) {
  return (
    <div className={`${styles.rowCard} ${mismatch ? styles.rowMismatch : ""}`}>
      {/* Card header */}
      <SalesRowHeader row={row} idx={idx} canRemove={canRemove} onRemoveRow={onRemoveRow} />

      {/* Row 1: SKU + Channel */}
      <div className={styles.formRow}>
        <div className={styles.inputGroup} style={{ minWidth: "220px", maxWidth: "340px" }}>
          <label className={styles.inputLabel} htmlFor={`sku-${row.id}`}>SKU ID *</label>
          <button
            id={`sku-${row.id}`}
            type="button"
            className={`${styles.skuPickerBtn} ${row.skuId ? styles.skuSelected : ""}`}
            onClick={() => onOpenPicker(row.id)}
          >
            {row.skuId || "Select SKU…"}
            <Icon name="sku-picker-chevron" size={14} row={row} />
          </button>
        </div>

        <div className={styles.inputGroup} style={{ minWidth: "180px", maxWidth: "260px" }}>
          <label className={styles.inputLabel} htmlFor={`channel-${row.id}`}>Sales Channel</label>
          <select
            id={`channel-${row.id}`}
            className={styles.itemSelect}
            value={row.salesChannel}
            onChange={(e) => onUpdateRow(row.id, "salesChannel", e.target.value)}
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
        <SkuPickerPanel
          row={row}
          loadingListings={loadingListings}
          filteredListings={filteredListings}
          onPickerSearch={onPickerSearch}
          onSelectSku={onSelectSku}
        />
      )}

      {/* Section: Unit Metrics */}
      <div className={styles.metricsSection}>
        <div className={styles.metricsSectionTitle}>
          <Icon name="icon-7cfeb828" size={14} />
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
                onChange={(e) => onUpdateRow(row.id, key, e.target.value)}
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
                  onClick={() => onResetNetUnits(row.id)}
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
              onChange={(e) => onUpdateRow(row.id, "netUnits", e.target.value)}
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
          <Icon name="icon-7e710d4a" size={14} />
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
                  onChange={(e) => onUpdateRow(row.id, key, e.target.value)}
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
}
