import Link from "next/link";
import Badge from "@/components/ui/Badge/Badge";
import Card from "@/components/ui/Card/Card";
import cx from "@/components/ui/cx";
import styles from "./RecentActivity.module.css";

export default function RecentActivity({ items, totalCount }) {
  return (
    <Card padding="lg" className={styles.root}>
      <h2 className={styles.title}>Recent Activity</h2>
      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item, idx) => {
            const isSale = item.grossUnits != null ? (item.grossUnits >= 0) : (item.type === "Sale");
            const qty = item.grossUnits != null ? (item.netUnits ?? item.grossUnits ?? 0) : Math.abs(Number(item.quantity) || 0);
            const platform = item.salesChannel || item.platform || "—";
            const date = item.createdAt ? new Date(item.createdAt) : (item.year && item.month ? new Date(item.year, item.month - 1, 15) : new Date(item.date));
            const dateStr = isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            const activityLabel = item.type || (item.grossUnits != null ? "Sales Record" : "Sale");
            return (
              <li key={idx} className={styles.item}>
                <span aria-hidden="true" className={cx(styles.dot, isSale ? styles.dotSale : styles.dotReturn)} />
                <div className={styles.content}>
                  <span className={styles.sku}>{item.skuId || "—"}</span>
                  <span className={styles.meta}>
                    {isSale ? "+" : "-"}{qty} unit{qty !== 1 ? "s" : ""} · {platform} · {dateStr}
                  </span>
                </div>
                <Badge tone={isSale ? "success" : "danger"}>{activityLabel}</Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>No recent activity</p>
      )}
      {totalCount > 8 && (
        <Link href="/sales-records" className={styles.viewAll}>
          View all {totalCount} records →
        </Link>
      )}
    </Card>
  );
}
