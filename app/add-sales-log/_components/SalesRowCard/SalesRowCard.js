import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
import cx from "@/components/ui/cx";
import styles from "./SalesRowCard.module.css";
import { SALES_CHANNELS, computeNetUnits } from "../../addSalesLogConfig";
import SalesRowHeader from "../SalesRowHeader/SalesRowHeader";
import SkuPickerPanel from "../SkuPickerPanel/SkuPickerPanel";

const UNIT_FIELDS = [
  { key: "grossUnits", label: "Gross Units" },
  { key: "logisticsReturns", label: "Logistics Returns" },
  { key: "customerReturns", label: "Customer Returns" },
  { key: "cancellations", label: "Cancellations" },
];

const FINANCIAL_FIELDS = [
  { key: "netSales", label: "Net Sales (₹)" },
  { key: "totalExpenses", label: "Total Expenses (₹)" },
  { key: "otherBenefits", label: "Other Benefits (₹)" },
  { key: "projectedBankSettlement", label: "Proj. Bank Settlement (₹)" },
];

/* Drops the `required` prop FormField injects, since it is not valid on a <button>. */
function SkuTrigger({ row, onClick, required: _required, ...rest }) {
  return (
    <button
      {...rest}
      type="button"
      className={cx(styles.skuPicker, row.skuId && styles.skuPickerFilled)}
      onClick={onClick}
      aria-expanded={row.pickerOpen}
    >
      <span className={styles.skuValue}>{row.skuId || "Select SKU…"}</span>
      <Icon
        name="click-to-select-from-inventory"
        size={14}
        className={cx(styles.chevron, row.pickerOpen && styles.chevronOpen)}
      />
    </button>
  );
}

/* Custom label row: the Auto tag / reset button sits beside the label, outside the <label>. */
function NetUnitsField({ row, mismatch, onUpdateRow, onResetNetUnits }) {
  const inputId = `netUnits-${row.id}`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={styles.netField}>
      <div className={styles.netLabelRow}>
        <label className={styles.netLabel} htmlFor={inputId}>Net Units</label>
        {row.netUnitsManual ? (
          <Button
            variant="ghost"
            size="sm"
            className={styles.autoReset}
            onClick={() => onResetNetUnits(row.id)}
            title="Reset to auto-calculated"
          >
            ↺ Auto
          </Button>
        ) : (
          <Badge tone="accent" className={styles.autoTag}>Auto</Badge>
        )}
      </div>
      <Input
        id={inputId}
        type="number"
        value={row.netUnits}
        onChange={(e) => onUpdateRow(row.id, "netUnits", e.target.value)}
        className={cx(styles.numeric, !row.netUnitsManual && styles.autoInput, mismatch && styles.mismatchInput)}
        placeholder="0"
        aria-invalid={mismatch || undefined}
        aria-describedby={mismatch ? hintId : undefined}
      />
      {mismatch && (
        <span id={hintId} className={styles.mismatchHint}>
          ⚠ Calculated: {computeNetUnits(row)}
        </span>
      )}
    </div>
  );
}

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
    <Card as="section" padding="lg" className={cx(styles.root, mismatch && styles.rowMismatch)}>
      {/* Card header */}
      <SalesRowHeader row={row} idx={idx} canRemove={canRemove} onRemoveRow={onRemoveRow} />

      {/* Row 1: SKU + Channel */}
      <div className={styles.identityGrid}>
        <FormField label="SKU ID" required>
          <SkuTrigger id={`sku-${row.id}`} row={row} onClick={() => onOpenPicker(row.id)} />
        </FormField>

        <FormField label="Sales Channel">
          <Select
            id={`channel-${row.id}`}
            value={row.salesChannel}
            onChange={(e) => onUpdateRow(row.id, "salesChannel", e.target.value)}
          >
            <option value="">— Select Channel —</option>
            {SALES_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </Select>
        </FormField>
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
      <div className={styles.metrics}>
        <h3 className={styles.metricsTitle}>
          <Icon name="icon-7cfeb828" size={14} />
          Unit Metrics
        </h3>
        <div className={styles.unitGrid}>
          {UNIT_FIELDS.map(({ key, label }) => (
            <FormField key={key} label={label}>
              <Input
                id={`${key}-${row.id}`}
                type="number"
                min="0"
                value={row[key]}
                onChange={(e) => onUpdateRow(row.id, key, e.target.value)}
                className={styles.numeric}
                placeholder="0"
              />
            </FormField>
          ))}

          {/* Net Units — auto-calculated */}
          <NetUnitsField
            row={row}
            mismatch={mismatch}
            onUpdateRow={onUpdateRow}
            onResetNetUnits={onResetNetUnits}
          />
        </div>
      </div>

      {/* Section: Financial Metrics */}
      <div className={styles.metrics}>
        <h3 className={styles.metricsTitle}>
          <Icon name="icon-7e710d4a" size={14} />
          Financial Metrics
        </h3>
        <div className={styles.financialGrid}>
          {FINANCIAL_FIELDS.map(({ key, label }) => (
            <FormField key={key} label={label}>
              <Input
                id={`${key}-${row.id}`}
                type="number"
                min="0"
                step="0.01"
                leading="₹"
                value={row[key]}
                onChange={(e) => onUpdateRow(row.id, key, e.target.value)}
                className={styles.numeric}
                placeholder="0.00"
              />
            </FormField>
          ))}
        </div>
      </div>
    </Card>
  );
}
