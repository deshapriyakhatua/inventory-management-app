import Icon from "@/components/ui/Icon/Icon";
import styles from "./TotalsSummary.module.css";

export default function TotalsSummary({ totals }) {
  return (
    <div className={styles.totalsSection}>
      <div className={styles.totalsHeader}>
        <Icon name="icon-3af5fc37" size={18} />
        Summary Totals
      </div>
      <div className={styles.totalsGrid}>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Gross Units</span>
          <span className={styles.totalValue}>{totals.grossUnits}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Log. Returns</span>
          <span className={styles.totalValue}>{totals.logisticsReturns}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Cust. Returns</span>
          <span className={styles.totalValue}>{totals.customerReturns}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Cancellations</span>
          <span className={styles.totalValue}>{totals.cancellations}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Net Units</span>
          <span className={styles.totalValue}>{totals.netUnits}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Net Sales</span>
          <span className={styles.totalValueCurrency}>₹{(totals.netSales ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Total Expenses</span>
          <span className={styles.totalValueCurrency}>₹{(totals.totalExpenses ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Other Benefits</span>
          <span className={styles.totalValueCurrency}>₹{(totals.otherBenefits ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className={styles.totalBox}>
          <span className={styles.totalLabel}>Settlement</span>
          <span className={styles.totalValueCurrency}>₹{(totals.projectedBankSettlement ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}
