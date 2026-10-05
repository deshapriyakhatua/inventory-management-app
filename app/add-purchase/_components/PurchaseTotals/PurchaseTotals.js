import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import styles from "./PurchaseTotals.module.css";

export default function PurchaseTotals({ totals }) {
  const tiles = [
    { label: "Total Items", value: totals.totalLineItems },
    { label: "Total Quantity", value: `${totals.totalQuantity} units` },
    { label: "Subtotal", value: `₹${totals.subtotal.toFixed(2)}` },
    { label: "Total Shipping", value: `₹${totals.totalShipping.toFixed(2)}` },
    { label: "Total Tax", value: `₹${totals.totalTax.toFixed(2)}` },
  ];

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <Icon name="icon-7e710d4a" size={18} />
        <span>Purchase Summary &amp; Totals</span>
      </div>

      <div className={styles.grid}>
        {tiles.map(tile => (
          <div key={tile.label} className={styles.tile}>
            <span className={styles.label}>{tile.label}</span>
            <span className={styles.value}>{tile.value}</span>
          </div>
        ))}

        <div className={cx(styles.tile, styles.tileGrand)}>
          <span className={styles.label}>Grand Total</span>
          <span className={styles.value}>₹{totals.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </section>
  );
}
