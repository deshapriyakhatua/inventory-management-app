import Icon from "@/components/ui/Icon/Icon";
import styles from "./PeriodSelector.module.css";
import { MONTHS } from "../../addSalesLogConfig";

export default function PeriodSelector({ month, year, years, onMonthChange, onYearChange }) {
  return (
    <div className={styles.periodCard}>
      <div className={styles.periodCardTitle}>
        <Icon name="icon-333ab5ea" size={16} />
        Recording Period
      </div>
      <div className={styles.periodSelectors}>
        <div className={styles.selectorGroup}>
          <label className={styles.selectorLabel}>Month</label>
          <select
            id="month-select"
            className={styles.periodSelect}
            value={month}
            onChange={onMonthChange}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className={styles.selectorGroup}>
          <label className={styles.selectorLabel}>Year</label>
          <select
            id="year-select"
            className={styles.periodSelect}
            value={year}
            onChange={onYearChange}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
