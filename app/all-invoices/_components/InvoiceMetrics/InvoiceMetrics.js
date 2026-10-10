import MetricCard from "../MetricCard/MetricCard";
import styles from "./InvoiceMetrics.module.css";

export default function InvoiceMetrics({ invoiceCount, totalRevenue, totalReceived, totalBalance }) {
  return (
    <div className={styles.root}>
      <MetricCard tone="accent" iconName="pdf-preview" label="Total Invoices">
        {invoiceCount}
      </MetricCard>

      <MetricCard tone="success" iconName="icon-7e710d4a" label="Total Revenue">
        ₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </MetricCard>

      <MetricCard tone="warning" iconName="icon-3790acba" label="Total Received">
        ₹{totalReceived.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </MetricCard>

      <MetricCard tone="danger" iconName="icon-cfd589e1" label="Outstanding Balance">
        ₹{totalBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </MetricCard>
    </div>
  );
}
