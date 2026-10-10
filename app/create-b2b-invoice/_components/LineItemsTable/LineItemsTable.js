import Button from "@/components/ui/Button/Button";
import FormCard from "../FormCard/FormCard";
import LineItemRow from "../LineItemRow/LineItemRow";
import styles from "./LineItemsTable.module.css";

// Card 3: Line Items. Card-row layout: each LineItemRow stacks its labelled fields below
// 1280px and becomes one grid row from 1280px, where this column header row is shown instead.
export default function LineItemsTable({
  calculatedRows,
  inventoryList,
  onOpenInventoryPicker,
  onPickerMouseEnter,
  onPickerMouseMove,
  onPickerMouseLeave,
  onLineItemChange,
  onRemoveLineItem,
  onAddItemRow,
}) {
  return (
    <FormCard icon="icon-d0275ba0" title="Items List">
      <div className={styles.list}>
        <div className={styles.columns} aria-hidden="true">
          <span>Select Inventory</span>
          <span>Description</span>
          <span>HSN/SAC</span>
          <span className={styles.numeric}>Qty</span>
          <span className={styles.numeric}>Unit price (₹)</span>
          <span className={styles.numeric}>GST %</span>
          <span className={styles.numeric}>Total (₹)</span>
          <span />
        </div>
        {calculatedRows.map((item, index) => (
          <LineItemRow
            key={index}
            item={item}
            index={index}
            inventoryList={inventoryList}
            onOpenInventoryPicker={onOpenInventoryPicker}
            onPickerMouseEnter={onPickerMouseEnter}
            onPickerMouseMove={onPickerMouseMove}
            onPickerMouseLeave={onPickerMouseLeave}
            onLineItemChange={onLineItemChange}
            onRemoveLineItem={onRemoveLineItem}
          />
        ))}
      </div>

      <Button variant="secondary" className={styles.addButton} onClick={onAddItemRow}>
        + Add Item Row
      </Button>
    </FormCard>
  );
}
