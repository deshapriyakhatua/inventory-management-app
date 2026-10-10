import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import styles from "./EditLineItemRow.module.css";

// Inputs have no visible labels (placeholders only), so each reuses its placeholder as aria-label.
export default function EditLineItemRow({ item, idx, onChange, onRemove }) {
  return (
    <div className={styles.root}>
      <Input
        type="text"
        className={styles.description}
        placeholder="Description / SKU"
        aria-label="Description / SKU"
        value={item.description}
        onChange={(e) =>
          onChange(idx, "description", e.target.value)
        }
      />
      <Input
        type="text"
        placeholder="HSN"
        aria-label="HSN"
        value={item.hsnCode || "7117"}
        onChange={(e) =>
          onChange(idx, "hsnCode", e.target.value)
        }
      />
      <Input
        type="number"
        min="1"
        className={styles.numeric}
        placeholder="Qty"
        aria-label="Qty"
        value={item.quantity}
        onChange={(e) =>
          onChange(idx, "quantity", e.target.value)
        }
      />
      <Input
        type="number"
        step="0.01"
        className={styles.numeric}
        placeholder="Unit Price"
        aria-label="Unit Price"
        value={item.unitPrice}
        onChange={(e) =>
          onChange(idx, "unitPrice", e.target.value)
        }
      />
      <div className={styles.total}>
        ₹{(Number(item.totalAmount) || 0).toFixed(2)}
      </div>
      <IconButton
        name="remove-this-product"
        size="sm"
        className={styles.remove}
        aria-label="Remove line item"
        onClick={() => onRemove(idx)}
      />
    </div>
  );
}
