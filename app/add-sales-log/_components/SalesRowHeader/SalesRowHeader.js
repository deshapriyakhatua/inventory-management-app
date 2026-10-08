import Icon from "@/components/ui/Icon/Icon";
import styles from "./SalesRowHeader.module.css";

export default function SalesRowHeader({ row, idx, canRemove, onRemoveRow }) {
  return (
    <div className={styles.rowHeader}>
      <div className={styles.rowHeaderLeft}>
        <span className={styles.rowIndex}>{idx + 1}</span>
        <span className={styles.rowLabel}>
          {row.skuId ? row.skuId : "New SKU Entry"}
        </span>
        {row.salesChannel && (
          <span className={styles.channelTag}>{row.salesChannel}</span>
        )}
      </div>
      {canRemove && (
        <button className={styles.removeBtn} onClick={() => onRemoveRow(row.id)}>
          <Icon name="remove" size={13} />
          Remove
        </button>
      )}
    </div>
  );
}
