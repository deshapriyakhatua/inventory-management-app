import Icon from "@/components/ui/Icon/Icon";
import FormCard from "../FormCard/FormCard";
import LineItemRow from "../LineItemRow/LineItemRow";
import styles from "./LineItemsTable.module.css";

// Card 3: Line Items
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
    <FormCard>
      <h3 className={styles.sectionTitle}>
        <Icon name="icon-d0275ba0" />
        Items List
      </h3>

      <div className={styles.tableContainer}>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Select Inventory</th>
              <th style={{ width: "25%" }}>Description</th>
              <th style={{ width: "10%" }}>HSN/SAC</th>
              <th style={{ width: "10%" }}>Qty</th>
              <th style={{ width: "12%" }}>Unit price (₹)</th>
              <th style={{ width: "8%" }}>GST %</th>
              <th style={{ width: "10%" }}>Total (₹)</th>
              <th style={{ width: "5%" }}></th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>
      </div>

      <button type="button" className={styles.addItemBtn} onClick={onAddItemRow}>
        + Add Item Row
      </button>
    </FormCard>
  );
}
