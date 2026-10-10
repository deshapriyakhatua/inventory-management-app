import MetricCard from "../MetricCard/MetricCard";
import styles from "./InvoiceMetrics.module.css";

export default function InvoiceMetrics({ invoiceCount, totalRevenue, totalReceived, totalBalance }) {
  return (
    <div className={styles.metricsGrid}>
      <MetricCard tone="Blue" icon="📄" label="Total Invoices">
        {invoiceCount}
      </MetricCard>

      <MetricCard tone="Green" icon="₹" label="Total Revenue">
        ₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </MetricCard>

      <MetricCard tone="Amber" icon="💳" label="Total Received">
        ₹{totalReceived.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </MetricCard>

      <MetricCard tone="Red" icon="⚠️" label="Outstanding Balance">
        ₹{totalBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </MetricCard>
    </div>
  );
}
