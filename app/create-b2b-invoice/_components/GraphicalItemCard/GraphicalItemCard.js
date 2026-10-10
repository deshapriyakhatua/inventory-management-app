import Image from "next/image";
import Badge from "@/components/ui/Badge/Badge";
import Card from "@/components/ui/Card/Card";
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
    <Card padding="sm" className={styles.root}>
      <div className={styles.media}>
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={item.inventoryId || item.description}
            fill
            sizes="4.5rem"
            className={styles.image}
            unoptimized
          />
        ) : (
          <span className={styles.placeholder}>No Image</span>
        )}
      </div>

      <div className={styles.details}>
        {item.inventoryId && (
          <Badge tone="accent" className={styles.idTag}>
            {item.inventoryId}
          </Badge>
        )}
        <div className={styles.description}>{item.description || "Line Item"}</div>
        <div className={styles.meta}>
          <span>HSN: {item.hsnCode || "7117"}</span>
          <span aria-hidden="true">•</span>
          <span>Qty: {qty}</span>
          <span aria-hidden="true">•</span>
          <span>Unit Price: ₹{price.toFixed(2)}</span>
          <span aria-hidden="true">•</span>
          <span>GST: {taxRate}% (₹{taxAmt.toFixed(2)})</span>
        </div>
      </div>

      <div className={styles.pricing}>
        <div className={styles.total}>
          ₹{totalAmt.toFixed(2)}
        </div>
        <div className={styles.sub}>
          Sub: ₹{subtotalAmt.toFixed(2)}
        </div>
      </div>
    </Card>
  );
}
