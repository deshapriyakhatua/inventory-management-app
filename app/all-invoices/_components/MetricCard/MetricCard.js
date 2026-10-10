import styles from "./MetricCard.module.css";

// tone: "Blue" | "Green" | "Amber" | "Red" -> styles.iconBlue / iconGreen / iconAmber / iconRed
const TONE_CLASS = {
  Blue: styles.iconBlue,
  Green: styles.iconGreen,
  Amber: styles.iconAmber,
  Red: styles.iconRed,
};

export default function MetricCard({ tone, icon, label, children }) {
  return (
    <div className={styles.metricCard}>
      <div className={`${styles.metricIcon} ${TONE_CLASS[tone]}`}>{icon}</div>
      <div className={styles.metricInfo}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricValue}>{children}</span>
      </div>
    </div>
  );
}
