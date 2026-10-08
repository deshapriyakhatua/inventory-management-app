import Icon from "@/components/ui/Icon/Icon";
import styles from "./TotalsSummary.module.css";

const formatCurrency = (value) =>
  `₹${(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TotalsSummary({ totals }) {
  const tiles = [
    { label: "Gross Units", value: totals.grossUnits },
    { label: "Log. Returns", value: totals.logisticsReturns },
    { label: "Cust. Returns", value: totals.customerReturns },
    { label: "Cancellations", value: totals.cancellations },
    { label: "Net Units", value: totals.netUnits },
    { label: "Net Sales", value: formatCurrency(totals.netSales) },
    { label: "Total Expenses", value: formatCurrency(totals.totalExpenses) },
    { label: "Other Benefits", value: formatCurrency(totals.otherBenefits) },
    { label: "Settlement", value: formatCurrency(totals.projectedBankSettlement) },
  ];

  return (
    <section className={styles.root}>
      <h2 className={styles.header}>
        <Icon name="icon-3af5fc37" size={18} />
        Summary Totals
      </h2>
      <div className={styles.grid}>
        {tiles.map((tile) => (
          <div key={tile.label} className={styles.tile}>
            <span className={styles.label}>{tile.label}</span>
            <span className={styles.value}>{tile.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
