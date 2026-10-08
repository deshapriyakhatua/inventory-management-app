import Icon from "@/components/ui/Icon/Icon";
import styles from "./SalesLogHeader.module.css";
import { MONTHS } from "../../addSalesLogConfig";

export default function SalesLogHeader({ month, year }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerLeft}>
        <h1 className={styles.title}>Monthly Sales Log</h1>
        <p className={styles.subtitle}>Record aggregated sales data per SKU for a given month</p>
      </div>
      <div className={styles.periodBadge}>
        <Icon name="icon-f5ba4e77" size={16} />
        {MONTHS[month - 1]} {year}
      </div>
    </div>
  );
}
