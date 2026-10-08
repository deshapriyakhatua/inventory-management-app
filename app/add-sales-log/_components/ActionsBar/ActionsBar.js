import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import styles from "./ActionsBar.module.css";
import { MONTHS } from "../../addSalesLogConfig";

export default function ActionsBar({ rowCount, month, year, isSubmitting, onAddRow, onSubmit }) {
  return (
    <div className={styles.root}>
      <Button
        variant="secondary"
        className={styles.button}
        onClick={onAddRow}
        leftIcon={<Icon name="add-another-product" size={16} />}
      >
        Add Another SKU
      </Button>
      <span className={styles.rowCount}>{rowCount} SKU{rowCount > 1 ? "s" : ""} · {MONTHS[month - 1]} {year}</span>
      <Button
        id="submit-sales-log"
        className={styles.button}
        onClick={onSubmit}
        loading={isSubmitting}
        leftIcon={<Icon name="icon-5ab11cbf" size={16} />}
      >
        {isSubmitting ? "Saving…" : `Save ${rowCount} Record${rowCount > 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
