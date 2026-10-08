import Icon from "@/components/ui/Icon/Icon";
import styles from "./ActionsBar.module.css";
import { MONTHS } from "../../addSalesLogConfig";

export default function ActionsBar({ rowCount, month, year, isSubmitting, onAddRow, onSubmit }) {
  return (
    <div className={styles.actionsBar}>
        <div className={styles.actionsLeft}>
          <button className={styles.addRowBtn} onClick={onAddRow} type="button">
            <Icon name="add-another-product" size={16} />
            Add Another SKU
          </button>
        </div>
        <div className={styles.actionsMeta}>
          <span className={styles.rowCount}>{rowCount} SKU{rowCount > 1 ? "s" : ""} · {MONTHS[month - 1]} {year}</span>
          <button
            id="submit-sales-log"
            className={styles.submitBtn}
            onClick={onSubmit}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Saving…
              </>
            ) : (
              <>
                <Icon name="icon-5ab11cbf" size={16} />
                Save {rowCount} Record{rowCount > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
  );
}
