import Table from "@/components/ui/Table/Table";
import cx from "@/components/ui/cx";
import styles from "./ConflictItem.module.css";
import { MONTHS, COMPARE_FIELDS } from "../../addSalesLogConfig";

const DECISIONS = [
  { value: "override", label: "Override", tone: styles.toneOverride },
  { value: "keep", label: "Keep Both", tone: styles.toneKeep },
  { value: "skip", label: "Skip", tone: styles.toneSkip },
];

export default function ConflictItem({ conflict, decision, month, year, onDecisionChange }) {
  return (
    <article className={styles.root}>
      <div className={styles.header}>
        <div className={styles.lead}>
          <span className={styles.skuId}>{conflict.incoming.skuId} ({conflict.incoming.salesChannel || '—'})</span>
          <span className={styles.period}>
            {MONTHS[(conflict.existing.month ?? month) - 1]} {conflict.existing.year ?? year}
          </span>
        </div>
        <div className={styles.decisions}>
          {DECISIONS.map(({ value, label, tone }) => (
            <button
              key={value}
              type="button"
              aria-pressed={decision === value}
              className={cx(styles.decision, tone)}
              onClick={() => onDecisionChange(conflict.key, value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compare table */}
      <Table className={styles.table}>
        <Table.Head>
          <Table.Row hover={false}>
            <Table.Cell as="th">Field</Table.Cell>
            <Table.Cell as="th">Existing</Table.Cell>
            <Table.Cell as="th" className={styles.newHead}>New</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {COMPARE_FIELDS.map(({ key, label }) => {
            const oldVal = conflict.existing[key];
            const newVal = conflict.incoming[key];
            const changed = String(oldVal ?? "") !== String(newVal ?? "");
            const changedCell = changed && styles.changedCell;
            return (
              <Table.Row key={key}>
                <Table.Cell className={cx(styles.fieldName, changedCell)}>{label}</Table.Cell>
                <Table.Cell className={cx(styles.oldValue, changedCell)}>{oldVal ?? "—"}</Table.Cell>
                <Table.Cell className={cx(styles.newValue, changedCell, changed && styles.newValueChanged)}>
                  {newVal ?? "—"}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </article>
  );
}
