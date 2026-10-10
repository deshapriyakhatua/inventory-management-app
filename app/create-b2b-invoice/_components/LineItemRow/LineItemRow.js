import Icon from "@/components/ui/Icon/Icon";
import styles from "./LineItemRow.module.css";

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
  return (
    <tr>
      <td>
        {(() => {
          const selectedInv = inventoryList.find(
            (inv) => inv.inventoryId === item.inventoryId
          );
          return (
            <button
              type="button"
              className={`${styles.inventoryPickerBtn} ${
                item.inventoryId ? styles.inventoryPickerBtnFilled : ""
              }`}
              onClick={() => onOpenInventoryPicker(index)}
              onMouseEnter={(e) => onPickerMouseEnter(e, selectedInv)}
              onMouseMove={(e) => onPickerMouseMove(e, selectedInv)}
              onMouseLeave={onPickerMouseLeave}
              title="Click to select inventory item"
            >
              {selectedInv?.imageUrl ? (
                <img
                  src={selectedInv.imageUrl}
                  alt={item.inventoryId}
                  className={styles.pickerBtnImg}
                />
              ) : (
                <span className={styles.pickerBtnIcon}>
                  <Icon name="icon-b99b6c9f" size={16} />
                </span>
              )}
              <span
                className={
                  item.inventoryId
                    ? styles.pickerBtnId
                    : styles.pickerBtnPlaceholder
                }
              >
                {item.inventoryId || "Select Inventory..."}
              </span>
              <span className={styles.pickerBtnChevron}>
                <Icon name="click-to-select-from-inventory" size={14} />
              </span>
            </button>
          );
        })()}
      </td>
      <td>
        <input
          type="text"
          className={styles.tableInput}
          value={item.description}
          onChange={(e) =>
            onLineItemChange(index, "description", e.target.value)
          }
          required
        />
      </td>
      <td>
        <input
          type="text"
          className={styles.tableInput}
          value={item.hsnCode}
          onChange={(e) =>
            onLineItemChange(index, "hsnCode", e.target.value)
          }
        />
      </td>
      <td>
        <input
          type="number"
          min="1"
          className={styles.tableInput}
          value={item.quantity}
          onChange={(e) =>
            onLineItemChange(index, "quantity", e.target.value)
          }
          required
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          className={styles.tableInput}
          value={item.unitPrice}
          onChange={(e) =>
            onLineItemChange(index, "unitPrice", e.target.value)
          }
          required
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          className={styles.tableInput}
          value={item.gstRate}
          onChange={(e) =>
            onLineItemChange(index, "gstRate", e.target.value)
          }
        />
      </td>
      <td style={{ fontWeight: "600", color: "#34d399" }}>
        ₹{item.total.toFixed(2)}
      </td>
      <td>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => onRemoveLineItem(index)}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
