import styles from "./ChartTooltip.module.css";

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.root}>
      <p className={styles.label}>{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className={styles.item}>
          <span className={styles.dot} style={{ background: entry.color }} />
          <span>{entry.name}: <strong>{entry.value}</strong></span>
        </div>
      ))}
    </div>
  );
}
