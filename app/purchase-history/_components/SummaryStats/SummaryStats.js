import StatCard from "../StatCard/StatCard";
import styles from "./SummaryStats.module.css";

export default function SummaryStats({ stats }) {
  return (
    <div className={styles.root}>
      <StatCard iconName="pdf-preview" tone="accent" label="Invoices / Groups" value={stats.totalInvoices} />
      <StatCard iconName="icon-5d77ebc6" tone="chart" label="Line Items" value={stats.totalItems} />
      <StatCard
        iconName="icon-d0275ba0"
        tone="success"
        label="Purchased Qty"
        value={<>{stats.totalStockQty} units</>}
      />
      <StatCard
        iconName="icon-7e710d4a"
        tone="warning"
        label="Total Procurement Cost"
        value={<>₹{stats.totalCost.toFixed(2)}</>}
      />
    </div>
  );
}
