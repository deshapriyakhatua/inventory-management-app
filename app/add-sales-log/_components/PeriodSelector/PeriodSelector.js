import Card from "@/components/ui/Card/Card";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Select from "@/components/ui/Select/Select";
import styles from "./PeriodSelector.module.css";
import { MONTHS } from "../../addSalesLogConfig";

export default function PeriodSelector({ month, year, years, onMonthChange, onYearChange }) {
  return (
    <Card as="section" padding="lg" className={styles.root}>
      <h2 className={styles.title}>
        <Icon name="icon-333ab5ea" size={18} />
        Recording Period
      </h2>
      <div className={styles.grid}>
        <FormField label="Month">
          <Select id="month-select" value={month} onChange={onMonthChange}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Year">
          <Select id="year-select" value={year} onChange={onYearChange}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </FormField>
      </div>
    </Card>
  );
}
