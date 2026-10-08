import StatCard from "../StatCard/StatCard";
import styles from "./SummaryStats.module.css";

export default function SummaryStats({ stats }) {
  return (
    <div className={styles.statsGrid}>
      <StatCard
        iconName="pdf-preview"
        iconStyle={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}
        label="Invoices / Groups"
        value={stats.totalInvoices}
      />

      <StatCard
        iconName="icon-5d77ebc6"
        iconStyle={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}
        label="Line Items"
        value={stats.totalItems}
      />

      <StatCard
        iconName="icon-d0275ba0"
        iconStyle={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
        label="Purchased Qty"
        value={<>{stats.totalStockQty} units</>}
      />

      <StatCard
        iconName="icon-7e710d4a"
        iconStyle={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}
        label="Total Procurement Cost"
        value={<>₹{stats.totalCost.toFixed(2)}</>}
      />
    </div>
  );
}
