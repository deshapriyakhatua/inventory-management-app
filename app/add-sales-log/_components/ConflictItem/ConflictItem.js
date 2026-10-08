import styles from "./ConflictItem.module.css";
import { MONTHS, COMPARE_FIELDS } from "../../addSalesLogConfig";

export default function ConflictItem({ conflict, decision, month, year, onDecisionChange }) {
  return (
      <div className={styles.conflictItem}>
        <div className={styles.conflictItemHeader}>
          <div className={styles.conflictItemLeft}>
            <span className={styles.conflictSkuId}>{conflict.incoming.skuId} ({conflict.incoming.salesChannel || '—'})</span>
            <span className={styles.conflictPeriod}>
            {MONTHS[(conflict.existing.month ?? month) - 1]} {conflict.existing.year ?? year}
          </span>
        </div>
        <div className={styles.decisionGroup}>
          <button
            className={`${styles.decisionBtn} ${styles.overrideBtn} ${decision === "override" ? styles.decisionActive : ""}`}
            onClick={() =>
              onDecisionChange(conflict.key, "override")
            }
          >
            Override
          </button>
          <button
            className={`${styles.decisionBtn} ${styles.keepBtn} ${decision === "keep" ? styles.decisionActive : ""}`}
            onClick={() =>
              onDecisionChange(conflict.key, "keep")
            }
          >
            Keep Both
          </button>
          <button
            className={`${styles.decisionBtn} ${styles.skipBtn} ${decision === "skip" ? styles.decisionActive : ""}`}
            onClick={() =>
              onDecisionChange(conflict.key, "skip")
            }
          >
            Skip
          </button>
        </div>
      </div>

      {/* Compare table */}
      <div className={styles.compareTable}>
        <div className={styles.compareHeaderRow}>
          <span className={styles.compareFieldCol}>Field</span>
          <span className={styles.compareOldCol}>Existing</span>
          <span className={styles.compareNewCol}>New</span>
        </div>
        {COMPARE_FIELDS.map(({ key, label }) => {
          const oldVal = conflict.existing[key];
          const newVal = conflict.incoming[key];
          const changed = String(oldVal ?? "") !== String(newVal ?? "");
          return (
            <div key={key} className={`${styles.compareRow} ${changed ? styles.compareChanged : ""}`}>
              <span className={styles.compareFieldName}>{label}</span>
              <span className={styles.compareOldVal}>{oldVal ?? "—"}</span>
              <span className={styles.compareNewVal}>{newVal ?? "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
