import styles from "./EditLineItemRow.module.css";

export default function EditLineItemRow({ item, idx, onChange, onRemove }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 40px",
        gap: "8px",
        marginBottom: "8px",
        alignItems: "center",
      }}
    >
      <input
        type="text"
        className={styles.modalInput}
        placeholder="Description / SKU"
        value={item.description}
        onChange={(e) =>
          onChange(idx, "description", e.target.value)
        }
      />
      <input
        type="text"
        className={styles.modalInput}
        placeholder="HSN"
        value={item.hsnCode || "7117"}
        onChange={(e) =>
          onChange(idx, "hsnCode", e.target.value)
        }
      />
      <input
        type="number"
        min="1"
        className={styles.modalInput}
        placeholder="Qty"
        value={item.quantity}
        onChange={(e) =>
          onChange(idx, "quantity", e.target.value)
        }
      />
      <input
        type="number"
        step="0.01"
        className={styles.modalInput}
        placeholder="Unit Price"
        value={item.unitPrice}
        onChange={(e) =>
          onChange(idx, "unitPrice", e.target.value)
        }
      />
      <div style={{ color: "#34d399", fontWeight: "600", fontSize: "13px" }}>
        ₹{(Number(item.totalAmount) || 0).toFixed(2)}
      </div>
      <button
        type="button"
        style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
        onClick={() => onRemove(idx)}
      >
        ✕
      </button>
    </div>
  );
}
