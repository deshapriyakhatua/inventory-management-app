import ItemThumbnail from "../ItemThumbnail/ItemThumbnail";
import StatusPill from "../StatusPill/StatusPill";
import RowActions from "../RowActions/RowActions";
import { calculateTotal, calculateFinalUnitPrice, formatDate } from "../../purchaseHistoryUtils";
import styles from "./FlatRow.module.css";

export default function FlatRow({
  item: p,
  isArchived,
  onImageMouseEnter,
  onImageMouseLeave,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const finalUnitPrice = calculateFinalUnitPrice(p);
  return (
    <tr className={`${styles.tr} ${isArchived ? styles.archivedRow : ""}`}>
      <td className={styles.td}>
        <ItemThumbnail item={p} onMouseEnter={onImageMouseEnter} onMouseLeave={onImageMouseLeave} />
      </td>
      <td className={styles.td}>{formatDate(p.orderedOn)}</td>
      <td className={`${styles.td} ${styles.sellerCell}`}>{p.sellerId?.businessName || "Unknown"}</td>
      <td className={styles.td}>{p.sellerProductId}</td>
      <td className={`${styles.td} ${styles.idCell}`}>{p.inventoryId}</td>
      <td className={`${styles.td} ${styles.quantity}`}>{p.quantity}</td>
      <td className={`${styles.td} ${styles.price}`}>₹{p.price.toFixed(2)}</td>
      <td className={`${styles.td} ${styles.finalUnitPrice}`}>₹{finalUnitPrice.toFixed(2)}</td>
      <td className={`${styles.td} ${styles.total}`}>₹{calculateTotal(p).toFixed(2)}</td>
      <td className={styles.td}>{p.invoiceNo || "-"}</td>
      <td className={styles.td}>{formatDate(p.receivedOn)}</td>
      <td className={styles.td}>
        <StatusPill tone={p.receivedOn ? "received" : "pending"}>
          {p.receivedOn ? "Delivered" : "In-Transit"}
        </StatusPill>
      </td>
      <td className={styles.td}>
        <RowActions
          item={p}
          isArchived={isArchived}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
