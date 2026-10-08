import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import styles from "./SalesRowHeader.module.css";

export default function SalesRowHeader({ row, idx, canRemove, onRemoveRow }) {
  return (
    <div className={styles.root}>
      <div className={styles.lead}>
        <span className={styles.index}>{idx + 1}</span>
        <span className={cx(styles.label, row.skuId && styles.labelFilled)}>
          {row.skuId ? row.skuId : "New SKU Entry"}
        </span>
        {row.salesChannel && <Badge tone="accent">{row.salesChannel}</Badge>}
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          className={styles.removeButton}
          onClick={() => onRemoveRow(row.id)}
          leftIcon={<Icon name="remove" size={14} />}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
