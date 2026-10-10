import Image from "next/image";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import cx from "@/components/ui/cx";
import styles from "./LineItemRow.module.css";

// One line item as a card row. Each input is wrapped in a <label> whose text reuses the
// column header copy; the label is visible below 1280px and visually hidden from 1280px.
export default function LineItemRow({
  item,
  index,
  inventoryList,
  onOpenInventoryPicker,
  onPickerMouseEnter,
  onPickerMouseMove,
  onPickerMouseLeave,
  onLineItemChange,
  onRemoveLineItem,
}) {
  const selectedInv = inventoryList.find(
    (inv) => inv.inventoryId === item.inventoryId
  );

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={cx(styles.picker, item.inventoryId && styles.pickerFilled)}
        onClick={() => onOpenInventoryPicker(index)}
        onMouseEnter={(e) => onPickerMouseEnter(e, selectedInv)}
        onMouseMove={(e) => onPickerMouseMove(e, selectedInv)}
        onMouseLeave={onPickerMouseLeave}
        title="Click to select inventory item"
      >
        {selectedInv?.imageUrl ? (
          <Image
            src={selectedInv.imageUrl}
            alt={item.inventoryId}
            width={24}
            height={24}
            className={styles.pickerImage}
          />
        ) : (
          <span className={styles.pickerIcon}>
            <Icon name="icon-b99b6c9f" size={16} />
          </span>
        )}
        <span className={item.inventoryId ? styles.pickerValue : styles.pickerPlaceholder}>
          {item.inventoryId || "Select Inventory..."}
        </span>
        <span className={styles.pickerChevron}>
          <Icon name="click-to-select-from-inventory" size={14} />
        </span>
      </button>

      <label className={cx(styles.field, styles.description)}>
        <span className={styles.fieldLabel}>Description</span>
        <Input
          type="text"
          value={item.description}
          onChange={(e) =>
            onLineItemChange(index, "description", e.target.value)
          }
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>HSN/SAC</span>
        <Input
          type="text"
          value={item.hsnCode}
          onChange={(e) =>
            onLineItemChange(index, "hsnCode", e.target.value)
          }
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Qty</span>
        <Input
          type="number"
          min="1"
          className={styles.numeric}
          value={item.quantity}
          onChange={(e) =>
            onLineItemChange(index, "quantity", e.target.value)
          }
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Unit price (₹)</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          className={styles.numeric}
          value={item.unitPrice}
          onChange={(e) =>
            onLineItemChange(index, "unitPrice", e.target.value)
          }
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>GST %</span>
        <Input
          type="number"
          min="0"
          className={styles.numeric}
          value={item.gstRate}
          onChange={(e) =>
            onLineItemChange(index, "gstRate", e.target.value)
          }
        />
      </label>

      <div className={cx(styles.field, styles.total)}>
        <span className={styles.fieldLabel}>Total (₹)</span>
        <span className={styles.totalValue}>₹{item.total.toFixed(2)}</span>
      </div>

      <IconButton
        name="remove-this-product"
        size="sm"
        className={styles.remove}
        aria-label="Remove line item"
        onClick={() => onRemoveLineItem(index)}
      />
    </div>
  );
}
