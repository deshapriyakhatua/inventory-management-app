import styles from "./GraphicalItemCard.module.css";

export default function GraphicalItemCard({ item, inventoryList }) {
  const matchedInv = inventoryList.find(
    (inv) => inv.inventoryId === item.inventoryId
  );
  const imgUrl = matchedInv?.imageUrl || item.imageUrl;
  const qty = Number(item.quantity) || 1;
  const price = Number(item.unitPrice) || 0;
  const subtotalAmt = item.amount !== undefined ? Number(item.amount) : qty * price;
  const taxRate = Number(item.taxRate !== undefined ? item.taxRate : item.gstRate) || 0;
  const taxAmt = item.taxAmount !== undefined ? Number(item.taxAmount) : (subtotalAmt * taxRate) / 100;
  const totalAmt = item.totalAmount !== undefined ? Number(item.totalAmount) : subtotalAmt + taxAmt;

  return (
    <div className={styles.graphicalItemCard}>
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={item.inventoryId || item.description}
          className={styles.graphicalItemImg}
        />
      ) : (
        <div className={styles.graphicalItemNoImg}>No Image</div>
      )}

      <div className={styles.graphicalItemDetails}>
        {item.inventoryId && (
          <span className={styles.graphicalItemIdTag}>
            {item.inventoryId}
          </span>
        )}
        <div className={styles.graphicalItemDesc}>{item.description || "Line Item"}</div>
        <div className={styles.graphicalItemMeta}>
          <span>HSN: {item.hsnCode || "7117"}</span>
          <span>•</span>
          <span>Qty: {qty}</span>
          <span>•</span>
          <span>Unit Price: ₹{price.toFixed(2)}</span>
          <span>•</span>
          <span>GST: {taxRate}% (₹{taxAmt.toFixed(2)})</span>
        </div>
      </div>

      <div className={styles.graphicalItemPricing}>
        <div className={styles.graphicalItemTotal}>
          ₹{totalAmt.toFixed(2)}
        </div>
        <div className={styles.graphicalItemSub}>
          Sub: ₹{subtotalAmt.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
